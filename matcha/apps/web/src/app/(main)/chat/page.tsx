"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search,
  Send,
  Mic,
  Square,
  AudioWaveform,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Loader
} from 'lucide-react';
import { toast } from 'sonner';
import chatApi, { Conversation, Message } from '@/services/chat.api';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ChatApp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const desiredConversationId = Number(searchParams.get('conversationId') ?? 0)
  const { token, user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showContacts, setShowContacts] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [messagePageNum, setMessagePageNum] = useState(1);
  const [totalMessagePages, setTotalMessagePages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteAudioMessageId, setDeleteAudioMessageId] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingSecondsRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSelectedRef = useRef(false);
  const activeConversationIdRef = useRef<number | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  const messageIdKey = useCallback((id: unknown) => String(id), [])

  const dedupeMessages = useCallback((list: Message[]) => {
    const seen = new Set<string>()
    return list.filter((message) => {
      const key = messageIdKey(message.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [messageIdKey])

  const resolveAvatarUrl = useCallback((avatar?: string, firstName?: string, lastName?: string) => {
    const fallback = `https://ui-avatars.com/api/?name=${firstName ?? ''}+${lastName ?? ''}`
    if (!avatar) return fallback
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar

    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const normalizedPath = avatar.startsWith('/') ? avatar : `/${avatar}`
    return `${base}${normalizedPath}`
  }, [])

  const resolveMediaUrl = useCallback((mediaUrl?: string | null) => {
    if (!mediaUrl) return ''
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) return mediaUrl

    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const normalizedPath = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`
    return `${base}${normalizedPath}`
  }, [])

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }, [])

  const formatMessageTime = useCallback((value: string) => {
    const date = new Date(value)
    const now = new Date()

    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()

    if (sameDay) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()

    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const bumpConversationPreview = useCallback((conversationId: number, content: string, createdAt: string, increaseUnread = false) => {
    setConversations((prev) => {
      const next = prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              last_message: content,
              last_message_at: createdAt,
              updated_at: createdAt,
              unreadCount: increaseUnread ? (conversation.unreadCount ?? 0) + 1 : (conversation.unreadCount ?? 0),
            }
          : conversation,
      )

      return next.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
    })
  }, [])

  const markConversationReadLocally = useCallback((conversationId: number) => {
    setConversations((prev) => prev.map((conversation) => (
      conversation.id === conversationId
        ? { ...conversation, unreadCount: 0 }
        : conversation
    )))
  }, [])

  const markConversationAsRead = useCallback(async (conversationId: number) => {
    try {
      await chatApi.markAsRead(conversationId)
      markConversationReadLocally(conversationId)
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }, [markConversationReadLocally])

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  // Initialize socket.io and fetch conversations
  useEffect(() => {
    if (!token) return

    const socketBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002').replace(/\/api\/?$/, '')

    // Initialize Socket.io
    const socket = io(socketBaseUrl, {
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['websocket']
    })

    socket.on('connect', () => {
      console.log('Socket connected')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connect error:', error.message)
    })

    socket.on('message_received', (msg: Message) => {
      if (msg.conversationId === activeConversationIdRef.current) {
        setMessages((prev) => {
          if (prev.some((existing) => messageIdKey(existing.id) === messageIdKey(msg.id))) {
            return prev
          }

          return [...prev, msg]
        })

        if (msg.conversationId) {
          markConversationAsRead(msg.conversationId)
        }
      }

      if (msg.conversationId) {
        const isActiveConversation = msg.conversationId === activeConversationIdRef.current
        const previewText = msg.messageType === 'audio' ? 'Audio message' : msg.content
        bumpConversationPreview(msg.conversationId, previewText, msg.createdAt, !isActiveConversation)
      }
    })

    socket.on('error', (error: any) => {
      console.error('Socket error:', error)
    })

    socket.on('message_deleted', (payload: { conversationId: number; messageId: number; lastMessage?: string; lastMessageAt?: string }) => {
      setMessages((prev) => prev.filter((message) => message.id !== payload.messageId))

      if (payload.conversationId) {
        const fallbackTime = new Date().toISOString()
        bumpConversationPreview(
          payload.conversationId,
          payload.lastMessage ?? '',
          payload.lastMessageAt ?? fallbackTime,
          false,
        )
      }
    })

    socketRef.current = socket

    // Fetch conversations
    fetchConversations()

    // Cleanup
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, bumpConversationPreview, messageIdKey, markConversationAsRead])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current)
      }
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages, scrollToBottom])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true)
    try {
      const response = await chatApi.getConversations(1, 50)
      setConversations(response.data)

      if (desiredConversationId > 0) {
        const requested = response.data.find((item) => item.id === desiredConversationId)
        if (requested) {
          setActiveConversationId(requested.id)
          hasAutoSelectedRef.current = true
          return
        }
      }
      
      // Auto-select first conversation if available and hasn't been auto-selected yet
      if (response.data.length > 0 && !hasAutoSelectedRef.current) {
        setActiveConversationId(response.data[0].id)
        hasAutoSelectedRef.current = true
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [desiredConversationId])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true)
      try {
        const response = await chatApi.getMessages(activeConversationId, 1, 30)
        setMessages(dedupeMessages(response.data))
        setMessagePageNum(1)
        setTotalMessagePages(response.pagination.totalPages)
        await chatApi.markAsRead(activeConversationId)
        markConversationReadLocally(activeConversationId)
        setTimeout(() => scrollToBottom('auto'), 0)

        // Join socket room for this conversation
        socketRef.current?.emit('join_conversation', activeConversationId)
      } catch (error) {
        console.error('Failed to fetch messages:', error)
        setMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()

    return () => {
      socketRef.current?.emit('leave_conversation', activeConversationId)
    }
  }, [activeConversationId, dedupeMessages, markConversationReadLocally, scrollToBottom])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle contact click
  const handleContactClick = (conversationId: number) => {
    setActiveConversationId(conversationId);
    if (isMobile) {
      setShowContacts(false);
    }
  };

  // Go back to contacts list on mobile
  const handleBackToContacts = () => {
    if (isMobile) {
      setShowContacts(true);
      setActiveConversationId(null);
      hasAutoSelectedRef.current = false;
    }
  };

  const handleOpenProfile = () => {
    if (!activeConversation?.other_user_id) return
    router.push(`/user/${activeConversation.other_user_id}`)
  }

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConversationId || isSending) return;

    setIsSending(true);
    try {
      const contentToSend = messageText.trim()
      const response = await chatApi.sendMessage(activeConversationId, contentToSend);

      const myId = user?.id ?? user?.userId
      const createdAt = response?.message?.created_at ?? new Date().toISOString()

      setMessages((prev) => [
        ...dedupeMessages([
          ...prev,
          {
            id: response?.message?.id ?? Date.now(),
            conversationId: activeConversationId,
            senderId: response?.message?.sender_id ?? myId,
            username: user?.username ?? '',
            firstName: user?.first_name ?? user?.firstName ?? '',
            lastName: user?.last_name ?? user?.lastName ?? '',
            content: contentToSend,
            messageType: 'text',
            mediaUrl: null,
            mediaMime: null,
            mediaDurationSec: null,
            mediaSizeBytes: null,
            createdAt,
          },
        ]),
      ])

      bumpConversationPreview(activeConversationId, contentToSend, createdAt)
      markConversationReadLocally(activeConversationId)

      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    if (!activeConversationId || isRecording || isSendingAudio) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordingStreamRef.current = stream

      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ]

      const selectedMimeType = preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream)

      recordingChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const activeConvId = activeConversationIdRef.current
        if (!activeConvId) {
          recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
          recordingStreamRef.current = null
          return
        }

        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(recordingChunksRef.current, { type: mimeType })
        recordingChunksRef.current = []

        if (blob.size === 0) {
          recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
          recordingStreamRef.current = null
          return
        }

        const extension = mimeType.includes('ogg')
          ? 'ogg'
          : mimeType.includes('mp4')
            ? 'mp4'
            : mimeType.includes('mpeg')
              ? 'mp3'
              : mimeType.includes('wav')
                ? 'wav'
                : 'webm'

        const formData = new FormData()
        formData.append('audio', blob, `audio-message.${extension}`)
        formData.append('durationSec', String(recordingSecondsRef.current))

        setIsSendingAudio(true)
        try {
          const response = await chatApi.sendAudioMessage(activeConvId, formData)
          const myId = user?.id ?? user?.userId
          const createdAt = response?.message?.created_at ?? new Date().toISOString()

          setMessages((prev) => [
            ...dedupeMessages([
              ...prev,
              {
                id: response?.message?.id ?? Date.now(),
                conversationId: activeConvId,
                senderId: response?.message?.sender_id ?? myId,
                username: user?.username ?? '',
                firstName: user?.first_name ?? user?.firstName ?? '',
                lastName: user?.last_name ?? user?.lastName ?? '',
                content: response?.message?.content ?? '[Audio]',
                messageType: 'audio',
                mediaUrl: response?.message?.media_url,
                mediaMime: response?.message?.media_mime,
                mediaDurationSec: response?.message?.media_duration_sec,
                mediaSizeBytes: response?.message?.media_size_bytes,
                createdAt,
              },
            ]),
          ])

          bumpConversationPreview(activeConvId, 'Audio message', createdAt)
          markConversationReadLocally(activeConvId)
        } catch (error) {
          console.error('Failed to send audio message:', error)
          toast.error('Failed to send audio message')
        } finally {
          setIsSendingAudio(false)
          setRecordingSeconds(0)
          recordingSecondsRef.current = 0
          recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
          recordingStreamRef.current = null
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingSeconds(0)
      recordingSecondsRef.current = 0

      recordingTimerRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1
        setRecordingSeconds(recordingSecondsRef.current)
      }, 1000)
    } catch (error) {
      console.error('Unable to access microphone:', error)
      toast.error('Microphone access is required to record audio messages.')
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return
    mediaRecorderRef.current.stop()
    setIsRecording(false)
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const handleDeleteAudioMessage = (messageId: number) => {
    setDeleteAudioMessageId(messageId)
  }

  const confirmDeleteAudioMessage = async () => {
    if (!activeConversationId) return
    if (!deleteAudioMessageId) return

    try {
      await chatApi.deleteMessage(activeConversationId, deleteAudioMessageId)
      setMessages((prev) => prev.filter((message) => message.id !== deleteAudioMessageId))
      toast.success('Audio message deleted')
    } catch (error) {
      console.error('Failed to delete audio message:', error)
      toast.error('Failed to delete audio message')
    } finally {
      setDeleteAudioMessageId(null)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!activeConversationId || messagePageNum >= totalMessagePages) return;

    try {
      const response = await chatApi.getMessages(
        activeConversationId,
        messagePageNum + 1,
        30
      );
      setMessages((prev) => dedupeMessages([...response.data, ...prev]));
      setMessagePageNum(messagePageNum + 1);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-[calc(100dvh-8rem)] mt-16 mb-16 bg-gray-100 lg:h-screen lg:mt-0 lg:mb-0">
      {/* Contacts Sidebar */}
      <div className={`${
        isMobile 
          ? showContacts 
            ? 'w-full' 
            : 'hidden'
          : 'w-80'
      } bg-white border-r border-gray-200 flex flex-col`}>
        
        {/* Contacts Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Direct Messages</h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader size={24} className="animate-spin text-gray-400" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleContactClick(conversation.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                  activeConversationId === conversation.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : (conversation.unreadCount ?? 0) > 0
                      ? 'bg-slate-50 hover:bg-slate-100'
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={resolveAvatarUrl(conversation.avatar, conversation.firstName, conversation.lastName)}
                      alt={`${conversation.firstName} ${conversation.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.firstName} {conversation.lastName}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate flex-1 ${(conversation.unreadCount ?? 0) > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {conversation.last_message === '[Audio]' ? 'Audio message' : (conversation.last_message || 'No messages yet')}
                      </p>
                      {(conversation.unreadCount ?? 0) > 0 && (
                        <span className="ml-2 min-w-6 h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${
        isMobile 
          ? showContacts 
            ? 'hidden' 
            : 'w-full'
          : 'flex-1'
      } flex flex-col bg-white`}>
        
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isMobile && (
                    <button 
                      onClick={handleBackToContacts}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                  )}
                  <button
                    onClick={handleOpenProfile}
                    className="flex items-center space-x-3 rounded-lg px-1 py-1 hover:bg-gray-100 transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={resolveAvatarUrl(activeConversation?.avatar, activeConversation?.firstName, activeConversation?.lastName)}
                        alt={`${activeConversation?.firstName} ${activeConversation?.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        {activeConversation?.firstName} {activeConversation?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeConversation?.username}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader size={32} className="animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messagePageNum < totalMessagePages && (
                    <button
                      onClick={loadMoreMessages}
                      className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Load earlier messages
                    </button>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={`${String(msg.id)}-${msg.createdAt}`}
                      className={`flex ${msg.senderId === activeConversation?.other_user_id ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        msg.senderId === activeConversation?.other_user_id
                          ? 'bg-white text-gray-800 rounded-bl-md border'
                          : 'bg-blue-500 text-white rounded-br-md'
                      }`}>
                        {msg.messageType === 'audio' && msg.mediaUrl ? (
                          <div className="space-y-2 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                              <audio
                                controls
                                preload="metadata"
                                src={resolveMediaUrl(msg.mediaUrl)}
                                controlsList="nodownload noplaybackrate"
                                onContextMenu={(event) => event.preventDefault()}
                                className="w-56 max-w-full"
                              />
                              {msg.senderId !== activeConversation?.other_user_id && (
                                <Button
                                  onClick={() => handleDeleteAudioMessage(msg.id)}
                                  size="icon-sm"
                                  variant="secondary"
                                  title="Delete audio"
                                  aria-label="Delete audio"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        )}
                        <p className={`text-xs mt-2 ${
                          msg.senderId === activeConversation?.other_user_id ? 'text-gray-500' : 'text-blue-100'
                        }`}>
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                {isRecording ? (
                  <Button
                    onClick={stopRecording}
                    disabled={isSendingAudio}
                    variant="destructive"
                    size="icon"
                    className="mb-1"
                    title="Stop recording"
                  >
                    <Square size={20} />
                  </Button>
                ) : (
                  <Button
                    onClick={startRecording}
                    disabled={!activeConversationId || isSendingAudio}
                    variant="outline"
                    size="icon"
                    className="mb-1"
                    title="Record audio message"
                  >
                    <Mic size={20} className="text-gray-600" />
                  </Button>
                )}
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isRecording ? `Recording ${formatDuration(recordingSeconds)}...` : 'Type a message...'}
                    rows={1}
                    disabled={isSending || isSendingAudio}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isSending || isSendingAudio || isRecording}
                  size="icon"
                  className="mb-1"
                >
                  {(isSending || isSendingAudio) ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose a contact from your direct messages to start chatting.
              </p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteAudioMessageId !== null} onOpenChange={(open) => !open && setDeleteAudioMessageId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete audio message?</DialogTitle>
            <DialogDescription>
              This will permanently remove the voice message for both users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAudioMessageId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAudioMessage}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}