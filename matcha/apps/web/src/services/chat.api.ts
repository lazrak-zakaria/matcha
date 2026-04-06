import { apiService } from './api.interact'

export interface Conversation {
  id: number
  other_user_id: number
  username: string
  firstName: string
  lastName: string
  avatar: string
  last_message: string
  last_message_at: string
  unreadCount: number
  updated_at: string
}

export interface Message {
  id: number
  conversationId?: number
  senderId: number
  username?: string
  firstName?: string
  lastName?: string
  content: string
  messageType?: 'text' | 'audio'
  mediaUrl?: string | null
  mediaMime?: string | null
  mediaDurationSec?: number | null
  mediaSizeBytes?: number | null
  createdAt: string
}

export interface ConversationsResponse {
  data: Conversation[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface MessagesResponse {
  data: Message[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

const chatApi = {
  // Get all conversations for current user
  getConversations: async (page = 1, limit = 10): Promise<ConversationsResponse> => {
    try {
      return await apiService.getCall(`/chat?page=${page}&limit=${limit}`)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  },

  // Get or create conversation with specific user
  getOrCreateConversation: async (otherUserId: number): Promise<{ conversationId: number }> => {
    try {
      return await apiService.postCall(`/chat/with/${otherUserId}`, {})
    } catch (error) {
      console.error('Error getting/creating conversation:', error)
      throw error
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId: number, page = 1, limit = 20): Promise<MessagesResponse> => {
    try {
      return await apiService.getCall(`/chat/${conversationId}/messages?page=${page}&limit=${limit}`)
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  },

  // Send a message
  sendMessage: async (conversationId: number, content: string) => {
    try {
      return await apiService.postCall(`/chat/${conversationId}/messages`, { content })
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  // Send an audio message
  sendAudioMessage: async (conversationId: number, payload: FormData) => {
    try {
      return await apiService.postCall(`/chat/${conversationId}/audio`, payload)
    } catch (error) {
      console.error('Error sending audio message:', error)
      throw error
    }
  },

  // Delete a message (currently used for audio messages)
  deleteMessage: async (conversationId: number, messageId: number) => {
    try {
      return await apiService.deleteCall(`/chat/${conversationId}/messages/${messageId}`)
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  },

  // Mark all messages in a conversation as read
  markAsRead: async (conversationId: number) => {
    try {
      return await apiService.postCall(`/chat/${conversationId}/read`, {})
    } catch (error) {
      console.error('Error marking conversation as read:', error)
      throw error
    }
  }
}

export default chatApi
