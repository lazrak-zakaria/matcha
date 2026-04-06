import type { Request, Response } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pool } from '../../config/db/index.js'
import { io } from '../../app.js'


const chatController = {
    // Get all conversations for current user with pagination
    getConversations: async (req: Request, res: Response) => {
        try {
            const currentUserId = req.user?.userId
            const page = Math.max(1, parseInt(req.query.page as string) || 1)
            const pageSize = parseInt(req.query.limit as string) || 10
            const offset = (page - 1) * pageSize

            const countResult = await pool.query(`
                SELECT COUNT(*) as total
                FROM conversations c
                WHERE (c.user1_id = $1 OR c.user2_id = $1)
            `, [currentUserId])

            const total = parseInt(countResult.rows[0].total)
            const totalPages = Math.ceil(total / pageSize)

            const result = await pool.query(`
                SELECT 
                    c.id,
                    c.user1_id,
                    c.user2_id,
                    CASE 
                        WHEN c.user1_id = $1 THEN c.user2_id 
                        ELSE c.user1_id 
                    END as other_user_id,
                    u.username,
                    u.first_name AS "firstName",
                    u.last_name AS "lastName",
                    (
                        SELECT url
                        FROM images
                        WHERE user_id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
                        ORDER BY is_avatar DESC, id ASC
                        LIMIT 1
                    ) as avatar,
                    (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1) as last_message_at,
                                        (
                                                SELECT COUNT(*)::int
                                                FROM messages m
                                                WHERE m.conversation_id = c.id
                                                    AND m.sender_id <> $1
                                                    AND m.read_at IS NULL
                                        ) as "unreadCount",
                    c.updated_at
                FROM conversations c
                JOIN users u ON (
                    CASE 
                        WHEN c.user1_id = $1 THEN c.user2_id = u.id
                        ELSE c.user1_id = u.id
                    END
                )
                WHERE (c.user1_id = $1 OR c.user2_id = $1)
                ORDER BY c.updated_at DESC
                LIMIT $2 OFFSET $3
            `, [currentUserId, pageSize, offset])

            res.status(200).json({
                data: result.rows,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            })
        } catch (error) {
            console.error('Error fetching conversations:', error)
            res.status(500).json({ message: 'Failed to fetch conversations' })
        }
    },

    // Get messages for a conversation with pagination
    getMessages: async (req: Request, res: Response) => {
        try {
            const { conversationId } = req.params
            const currentUserId = req.user?.userId
            const page = Math.max(1, parseInt(req.query.page as string) || 1)
            const pageSize = parseInt(req.query.limit as string) || 20
            const offset = (page - 1) * pageSize

            // Check if user is part of conversation and not blocked
            const conversationCheck = await pool.query(`
                SELECT c.user1_id, c.user2_id
                FROM conversations c
                WHERE c.id = $1
                    AND (c.user1_id = $2 OR c.user2_id = $2)
            `, [conversationId, currentUserId])

            if (conversationCheck.rows.length === 0) {
                res.status(403).json({ message: 'Access denied' })
                return
            }

            const { user1_id, user2_id } = conversationCheck.rows[0]
            const otherUserId = user1_id === currentUserId ? user2_id : user1_id

            // Check if blocked
            const blockCheck = await pool.query(`
                SELECT 1 FROM blocks
                WHERE (blocker_id = $1 AND blocked_id = $2)
                   OR (blocker_id = $2 AND blocked_id = $1)
            `, [currentUserId, otherUserId])

            if (blockCheck.rows.length > 0) {
                res.status(403).json({ message: 'This conversation is no longer available' })
                return
            }

            // Count total messages
            const countResult = await pool.query(`
                SELECT COUNT(*) as total
                FROM messages
                WHERE conversation_id = $1
            `, [conversationId])

            const total = parseInt(countResult.rows[0].total)
            const totalPages = Math.ceil(total / pageSize)

            // Get messages
            const result = await pool.query(`
                SELECT 
                    m.id,
                    m.sender_id AS "senderId",
                    u.username,
                    u.first_name AS "firstName",
                    u.last_name AS "lastName",
                    m.content,
                    m.message_type AS "messageType",
                    m.media_url AS "mediaUrl",
                    m.media_mime AS "mediaMime",
                    m.media_duration_sec AS "mediaDurationSec",
                    m.media_size_bytes AS "mediaSizeBytes",
                    m.created_at AS "createdAt"
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = $1
                ORDER BY m.created_at DESC
                LIMIT $2 OFFSET $3
            `, [conversationId, pageSize, offset])

            res.status(200).json({
                data: result.rows.reverse(), // Reverse to show in chronological order
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            })
        } catch (error) {
            console.error('Error fetching messages:', error)
            res.status(500).json({ message: 'Failed to fetch messages' })
        }
    },

    // Send a message
    sendMessage: async (req: Request, res: Response) => {
        const client = await pool.connect()
        try {
            const { conversationId } = req.params
            const { content } = req.body
            const currentUserId = req.user?.userId

            if (!content || content.trim().length === 0) {
                res.status(400).json({ message: 'Message content is required' })
                return
            }

            await client.query('BEGIN')

            // Check if user is part of conversation
            const conversationCheck = await client.query(`
                SELECT c.user1_id, c.user2_id
                FROM conversations c
                WHERE c.id = $1
                    AND (c.user1_id = $2 OR c.user2_id = $2)
            `, [conversationId, currentUserId])

            if (conversationCheck.rows.length === 0) {
                await client.query('ROLLBACK')
                res.status(403).json({ message: 'Access denied' })
                return
            }

            const { user1_id, user2_id } = conversationCheck.rows[0]
            const otherUserId = user1_id === currentUserId ? user2_id : user1_id

            // Check if blocked
            const blockCheck = await client.query(`
                SELECT 1 FROM blocks
                WHERE (blocker_id = $1 AND blocked_id = $2)
                   OR (blocker_id = $2 AND blocked_id = $1)
            `, [currentUserId, otherUserId])

            if (blockCheck.rows.length > 0) {
                await client.query('ROLLBACK')
                res.status(403).json({ message: 'Cannot send message. This user is blocked' })
                return
            }

            // Insert message
            const result = await client.query(`
                INSERT INTO messages (conversation_id, sender_id, content, message_type)
                VALUES ($1, $2, $3, 'text')
                RETURNING id, conversation_id, sender_id, content, message_type, media_url, media_mime, media_duration_sec, media_size_bytes, created_at
            `, [conversationId, currentUserId, content.trim()])

            // Update conversation updated_at
            await client.query(`
                UPDATE conversations
                SET updated_at = now()
                WHERE id = $1
            `, [conversationId])

            await client.query('COMMIT')

            const senderResult = await pool.query(
                `
                SELECT
                    u.username,
                    (
                        SELECT url
                        FROM images i
                        WHERE i.user_id = u.id
                        ORDER BY i.is_avatar DESC, i.id ASC
                        LIMIT 1
                    ) AS avatar
                FROM users u
                WHERE u.id = $1
                `,
                [currentUserId],
            )
            const senderUsername = senderResult.rows[0]?.username ?? `User ${currentUserId}`
            const senderAvatar = senderResult.rows[0]?.avatar

            const notificationInsert = await pool.query(
                `
                INSERT INTO notifications (user_id, type, message, actor_id)
                VALUES ($1, 'message', $2, $3)
                RETURNING id, created_at AS "createdAt", message
                `,
                [otherUserId, `${senderUsername}: ${result.rows[0].content}`, currentUserId],
            )
            const messageNotification = notificationInsert.rows[0]

            io.to(`conversation_${conversationId}`).emit('message_received', {
                id: result.rows[0].id,
                conversationId: result.rows[0].conversation_id,
                senderId: result.rows[0].sender_id,
                content: result.rows[0].content,
                messageType: result.rows[0].message_type,
                mediaUrl: result.rows[0].media_url,
                mediaMime: result.rows[0].media_mime,
                mediaDurationSec: result.rows[0].media_duration_sec,
                mediaSizeBytes: result.rows[0].media_size_bytes,
                createdAt: result.rows[0].created_at
            })

            io.to(otherUserId.toString()).emit('notification', {
                id: messageNotification?.id,
                type: 'message',
                conversationId: Number(conversationId),
                from: currentUserId,
                message: messageNotification?.message ?? `${senderUsername}: ${result.rows[0].content}`,
                createdAt: messageNotification?.createdAt ?? result.rows[0].created_at,
                actorId: currentUserId,
                actorUsername: senderUsername,
                actorAvatar: senderAvatar,
            })

            res.status(201).json({
                message: result.rows[0]
            })
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('Error sending message:', error)
            res.status(500).json({ message: 'Failed to send message' })
        } finally {
            client.release()
        }
    },

    // Send an audio message
    sendAudioMessage: async (req: Request, res: Response) => {
        const client = await pool.connect()
        try {
            const { conversationId } = req.params
            const currentUserId = req.user?.userId
            const file = req.file

            if (!file) {
                res.status(400).json({ message: 'Audio file is required' })
                return
            }

            const durationFromBody = Number(req.body?.durationSec)
            const durationSec = Number.isFinite(durationFromBody) ? Math.max(0, Math.floor(durationFromBody)) : null

            await client.query('BEGIN')

            // Check if user is part of conversation
            const conversationCheck = await client.query(`
                SELECT c.user1_id, c.user2_id
                FROM conversations c
                WHERE c.id = $1
                    AND (c.user1_id = $2 OR c.user2_id = $2)
            `, [conversationId, currentUserId])

            if (conversationCheck.rows.length === 0) {
                await client.query('ROLLBACK')
                res.status(403).json({ message: 'Access denied' })
                return
            }

            const { user1_id, user2_id } = conversationCheck.rows[0]
            const otherUserId = user1_id === currentUserId ? user2_id : user1_id

            // Check if blocked
            const blockCheck = await client.query(`
                SELECT 1 FROM blocks
                WHERE (blocker_id = $1 AND blocked_id = $2)
                   OR (blocker_id = $2 AND blocked_id = $1)
            `, [currentUserId, otherUserId])

            if (blockCheck.rows.length > 0) {
                await client.query('ROLLBACK')
                res.status(403).json({ message: 'Cannot send message. This user is blocked' })
                return
            }

            const mediaUrl = `/public/audio/${file.filename}`

            // Insert audio message
            const result = await client.query(`
                INSERT INTO messages (
                    conversation_id,
                    sender_id,
                    content,
                    message_type,
                    media_url,
                    media_mime,
                    media_duration_sec,
                    media_size_bytes
                )
                VALUES ($1, $2, '[Audio]', 'audio', $3, $4, $5, $6)
                RETURNING id, conversation_id, sender_id, content, message_type, media_url, media_mime, media_duration_sec, media_size_bytes, created_at
            `, [conversationId, currentUserId, mediaUrl, file.mimetype, durationSec, file.size])

            // Update conversation updated_at
            await client.query(`
                UPDATE conversations
                SET updated_at = now()
                WHERE id = $1
            `, [conversationId])

            await client.query('COMMIT')

            const senderResult = await pool.query(
                `
                SELECT
                    u.username,
                    (
                        SELECT url
                        FROM images i
                        WHERE i.user_id = u.id
                        ORDER BY i.is_avatar DESC, i.id ASC
                        LIMIT 1
                    ) AS avatar
                FROM users u
                WHERE u.id = $1
                `,
                [currentUserId],
            )
            const senderUsername = senderResult.rows[0]?.username ?? `User ${currentUserId}`
            const senderAvatar = senderResult.rows[0]?.avatar

            const notificationInsert = await pool.query(
                `
                INSERT INTO notifications (user_id, type, message, actor_id)
                VALUES ($1, 'message', $2, $3)
                RETURNING id, created_at AS "createdAt", message
                `,
                [otherUserId, `${senderUsername} sent an audio message`, currentUserId],
            )
            const messageNotification = notificationInsert.rows[0]

            io.to(`conversation_${conversationId}`).emit('message_received', {
                id: result.rows[0].id,
                conversationId: result.rows[0].conversation_id,
                senderId: result.rows[0].sender_id,
                content: result.rows[0].content,
                messageType: result.rows[0].message_type,
                mediaUrl: result.rows[0].media_url,
                mediaMime: result.rows[0].media_mime,
                mediaDurationSec: result.rows[0].media_duration_sec,
                mediaSizeBytes: result.rows[0].media_size_bytes,
                createdAt: result.rows[0].created_at
            })

            io.to(otherUserId.toString()).emit('notification', {
                id: messageNotification?.id,
                type: 'message',
                conversationId: Number(conversationId),
                from: currentUserId,
                message: messageNotification?.message ?? `${senderUsername} sent an audio message`,
                createdAt: messageNotification?.createdAt ?? result.rows[0].created_at,
                actorId: currentUserId,
                actorUsername: senderUsername,
                actorAvatar: senderAvatar,
            })

            res.status(201).json({
                message: result.rows[0]
            })
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('Error sending audio message:', error)
            res.status(500).json({ message: 'Failed to send audio message' })
        } finally {
            client.release()
        }
    },

    // Delete a message (sender only)
    deleteMessage: async (req: Request, res: Response) => {
        const client = await pool.connect()
        try {
            const { conversationId, messageId } = req.params
            const currentUserId = req.user?.userId

            await client.query('BEGIN')

            const conversationCheck = await client.query(`
                SELECT c.user1_id, c.user2_id
                FROM conversations c
                WHERE c.id = $1
                  AND (c.user1_id = $2 OR c.user2_id = $2)
            `, [conversationId, currentUserId])

            if (conversationCheck.rows.length === 0) {
                await client.query('ROLLBACK')
                res.status(403).json({ message: 'Access denied' })
                return
            }

            const messageResult = await client.query(`
                SELECT id, sender_id, message_type, media_url
                FROM messages
                WHERE id = $1 AND conversation_id = $2
            `, [messageId, conversationId])

            if (messageResult.rows.length === 0) {
                await client.query('ROLLBACK')
                res.status(404).json({ message: 'Message not found' })
                return
            }

            const message = messageResult.rows[0]
            if (message.sender_id !== currentUserId) {
                await client.query('ROLLBACK')
                res.status(403).json({ message: 'You can only delete your own messages' })
                return
            }

            await client.query(`
                DELETE FROM messages
                WHERE id = $1 AND conversation_id = $2
            `, [messageId, conversationId])

            const latestMessageResult = await client.query(`
                SELECT content, created_at
                FROM messages
                WHERE conversation_id = $1
                ORDER BY created_at DESC, id DESC
                LIMIT 1
            `, [conversationId])

            const latestMessage = latestMessageResult.rows[0]
            const updatedAt = latestMessage?.created_at ?? new Date().toISOString()

            await client.query(`
                UPDATE conversations
                SET updated_at = $2
                WHERE id = $1
            `, [conversationId, updatedAt])

            await client.query('COMMIT')

            if (message.message_type === 'audio' && typeof message.media_url === 'string' && message.media_url.startsWith('/public/audio/')) {
                const relativeAudioPath = message.media_url.replace(/^\//, '')
                const absoluteAudioPath = path.join(process.cwd(), relativeAudioPath)
                fs.unlink(absoluteAudioPath).catch(() => undefined)
            }

            io.to(`conversation_${conversationId}`).emit('message_deleted', {
                conversationId: Number(conversationId),
                messageId: Number(messageId),
                deletedBy: currentUserId,
                lastMessage: latestMessage?.content ?? '',
                lastMessageAt: updatedAt,
            })

            res.status(200).json({
                success: true,
                messageId: Number(messageId),
                conversationId: Number(conversationId),
            })
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('Error deleting message:', error)
            res.status(500).json({ message: 'Failed to delete message' })
        } finally {
            client.release()
        }
    },

    // Get or create conversation
    getOrCreateConversation: async (req: Request, res: Response) => {
        const client = await pool.connect()
        try {
            const otherUserIdParam = req.params.otherUserId as string | undefined
            if (!otherUserIdParam) {
                res.status(400).json({ message: 'User ID is required' })
                return
            }
            const otherUserId = parseInt(otherUserIdParam, 10)
            const currentUserId = req.user?.userId

            if (!otherUserId || isNaN(otherUserId) || otherUserId === currentUserId) {
                res.status(400).json({ message: 'Invalid user ID' })
                return
            }

            await client.query('BEGIN')

            // Check if blocked
            const blockCheck = await client.query(`
                SELECT 1 FROM blocks
                WHERE (blocker_id = $1 AND blocked_id = $2)
                   OR (blocker_id = $2 AND blocked_id = $1)
            `, [currentUserId, otherUserId])

            if (blockCheck.rows.length > 0) {
                await client.query('ROLLBACK')
                res.status(403).json({ message: 'Cannot start conversation. This user is blocked' })
                return
            }

            // Find or create conversation
            let conversation = await client.query(`
                SELECT id FROM conversations
                WHERE (user1_id = $1 AND user2_id = $2)
                   OR (user1_id = $2 AND user2_id = $1)
            `, [currentUserId, otherUserId])

            let conversationId
            if (conversation.rows.length === 0) {
                const newConv = await client.query(`
                    INSERT INTO conversations (user1_id, user2_id)
                    VALUES ($1, $2)
                    RETURNING id
                `, [currentUserId, otherUserId])
                conversationId = newConv.rows[0].id
            } else {
                conversationId = conversation.rows[0].id
            }

            await client.query('COMMIT')

            res.status(200).json({ conversationId })
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('Error creating conversation:', error)
            res.status(500).json({ message: 'Failed to create conversation' })
        } finally {
            client.release()
        }
    },

    // Mark messages as read for current user in a conversation
    markConversationAsRead: async (req: Request, res: Response) => {
        try {
            const { conversationId } = req.params
            const currentUserId = req.user?.userId

            const conversationCheck = await pool.query(`
                SELECT 1
                FROM conversations c
                WHERE c.id = $1
                  AND (c.user1_id = $2 OR c.user2_id = $2)
            `, [conversationId, currentUserId])

            if (conversationCheck.rows.length === 0) {
                res.status(403).json({ message: 'Access denied' })
                return
            }

            const updateResult = await pool.query(`
                UPDATE messages
                SET read_at = now()
                WHERE conversation_id = $1
                  AND sender_id <> $2
                  AND read_at IS NULL
            `, [conversationId, currentUserId])

            res.status(200).json({
                success: true,
                updatedCount: updateResult.rowCount ?? 0
            })
        } catch (error) {
            console.error('Error marking conversation as read:', error)
            res.status(500).json({ message: 'Failed to mark conversation as read' })
        }
    }
}

export default chatController
export { chatController }
