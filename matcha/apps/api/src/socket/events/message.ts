import { io } from '../../app.js'
import { pool } from '../../config/db/index.js'

// Map to track which conversations users are listening to
const conversationListeners = new Map<number, Set<string>>()

export const messageEvents = {
    registerListeners: () => {
        io.on('connection', (socket) => {
            const userId = socket.data.user?.userId

            // Join conversation room
            socket.on('join_conversation', async (conversationId: number) => {
                try {
                    // Verify user is part of this conversation
                    const check = await pool.query(`
                        SELECT 1 FROM conversations
                        WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
                    `, [conversationId, userId])

                    if (check.rows.length === 0) {
                        socket.emit('error', { message: 'Access denied' })
                        return
                    }

                    // Add user to conversation listeners
                    if (!conversationListeners.has(conversationId)) {
                        conversationListeners.set(conversationId, new Set())
                    }
                    conversationListeners.get(conversationId)!.add(socket.id)

                    socket.join(`conversation_${conversationId}`)
                    console.log(`User ${userId} joined conversation ${conversationId}`)
                } catch (error) {
                    console.error('Error joining conversation:', error)
                    socket.emit('error', { message: 'Failed to join conversation' })
                }
            })

            // Leave conversation room
            socket.on('leave_conversation', (conversationId: number) => {
                socket.leave(`conversation_${conversationId}`)
                const listeners = conversationListeners.get(conversationId)
                if (listeners) {
                    listeners.delete(socket.id)
                    if (listeners.size === 0) {
                        conversationListeners.delete(conversationId)
                    }
                }
                console.log(`User ${userId} left conversation ${conversationId}`)
            })

            // Send message
            socket.on('send_message', async (data: { conversationId: number; content: string }) => {
                try {
                    const { conversationId, content } = data

                    if (!content || content.trim().length === 0) {
                        socket.emit('error', { message: 'Message content is required' })
                        return
                    }

                    // Get conversation and check authorization
                    const convResult = await pool.query(`
                        SELECT user1_id, user2_id FROM conversations
                        WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
                    `, [conversationId, userId])

                    if (convResult.rows.length === 0) {
                        socket.emit('error', { message: 'Access denied' })
                        return
                    }

                    const { user1_id, user2_id } = convResult.rows[0]
                    const otherUserId = user1_id === userId ? user2_id : user1_id

                    // Check if blocked
                    const blockCheck = await pool.query(`
                        SELECT 1 FROM blocks
                        WHERE (blocker_id = $1 AND blocked_id = $2)
                           OR (blocker_id = $2 AND blocked_id = $1)
                    `, [userId, otherUserId])

                    if (blockCheck.rows.length > 0) {
                        socket.emit('error', { message: 'Cannot send message. This user is blocked' })
                        return
                    }

                    // Insert message
                    const messageResult = await pool.query(`
                        INSERT INTO messages (conversation_id, sender_id, content)
                        VALUES ($1, $2, $3)
                        RETURNING id, sender_id, content, created_at
                    `, [conversationId, userId, content.trim()])

                    const message = messageResult.rows[0]

                    // Update conversation updated_at
                    await pool.query(`
                        UPDATE conversations
                        SET updated_at = now()
                        WHERE id = $1
                    `, [conversationId])

                    // Get sender info
                    const userResult = await pool.query(`
                        SELECT
                            u.id,
                            u.username,
                            u.first_name,
                            u.last_name,
                            (
                                SELECT url
                                FROM images i
                                WHERE i.user_id = u.id
                                ORDER BY i.is_avatar DESC, i.id ASC
                                LIMIT 1
                            ) AS avatar
                        FROM users u
                        WHERE u.id = $1
                    `, [userId])

                    const sender = userResult.rows[0]

                    // Broadcast to conversation room
                    io.to(`conversation_${conversationId}`).emit('message_received', {
                        id: message.id,
                        conversationId,
                        senderId: message.sender_id,
                        senderUsername: sender.username,
                        senderFirstName: sender.first_name,
                        senderLastName: sender.last_name,
                        content: message.content,
                        messageType: 'text',
                        mediaUrl: null,
                        mediaMime: null,
                        mediaDurationSec: null,
                        mediaSizeBytes: null,
                        createdAt: message.created_at
                    })

                    const notificationInsert = await pool.query(
                        `
                        INSERT INTO notifications (user_id, type, message, actor_id)
                        VALUES ($1, 'message', $2, $3)
                        RETURNING id, created_at AS "createdAt", message
                        `,
                        [otherUserId, `${sender.username}: ${message.content}`, userId],
                    )
                    const messageNotification = notificationInsert.rows[0]

                    io.to(otherUserId.toString()).emit('notification', {
                        id: messageNotification?.id,
                        type: 'message',
                        conversationId,
                        from: userId,
                        message: messageNotification?.message ?? `${sender.username}: ${message.content}`,
                        createdAt: messageNotification?.createdAt ?? message.created_at,
                        actorId: userId,
                        actorUsername: sender.username,
                        actorAvatar: sender.avatar,
                    })

                    socket.emit('message_sent', { id: message.id })
                } catch (error) {
                    console.error('Error sending message:', error)
                    socket.emit('error', { message: 'Failed to send message' })
                }
            })

            // Disconnect
            socket.on('disconnect', () => {
                // Clean up conversation listeners
                conversationListeners.forEach((listeners, conversationId) => {
                    listeners.delete(socket.id)
                    if (listeners.size === 0) {
                        conversationListeners.delete(conversationId)
                    }
                })
                console.log(`User ${userId} disconnected`)
            })
        })
    }
}

export const initMessageEvents = () => {
    messageEvents.registerListeners()
}
