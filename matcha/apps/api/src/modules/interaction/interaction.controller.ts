
import type { Request, Response } from 'express'
import { io } from '../../app.js'
import { pool } from '../../config/db/index.js'

const isBlockedBetween = async (
    client: { query: (text: string, params?: unknown[]) => Promise<unknown> },
    userA: number,
    userB: number,
) => {
    const blockResult = await client.query(
        `
        SELECT 1
        FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = $2)
           OR (blocker_id = $2 AND blocked_id = $1)
        LIMIT 1
        `,
        [userA, userB],
    ) as { rows: Array<{ '?column?': number }> }

    return blockResult.rows.length > 0
}

const insertNotification = async (
    client: { query: (text: string, params?: unknown[]) => Promise<unknown> },
    userId: number,
    type: string,
    message: string,
    actorId?: number,
) => {
    if (actorId && await isBlockedBetween(client, userId, actorId)) {
        return null
    }

    const result = await client.query(
        'INSERT INTO notifications (user_id, type, message, actor_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at AS "createdAt", type, message, actor_id AS "actorId"',
        [userId, type, message, actorId ?? null]
    ) as { rows: Array<{ id: number; createdAt: string; type: string; message: string }> }

    const inserted = result.rows[0]
    if (!inserted) {
        throw new Error('Failed to insert notification')
    }

    return inserted
}


export const likesController = {


    // swip right
    likeUser: async (req: Request, res: Response) => {
        const client = await pool.connect()
        let isMatch = false;
        let pendingMatchNotifications: Array<{
            userId: number
            payload: {
                id: number
                type: string
                from: number | undefined
                message: string
                createdAt: string
                actorId: number
                actorUsername: string
                actorAvatar?: string
            }
        }> = []
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId
            const targetUserId = Number(userId)

            if (!currentUserId || !targetUserId) {
                res.status(400).json({ message: 'Invalid users for like operation' })
                return
            }

            const blocked = await isBlockedBetween(client, Number(currentUserId), targetUserId)
            if (blocked) {
                res.status(403).json({ message: 'Cannot like user while blocked' })
                return
            }

            const [currentUserResult, targetUserResult, currentAvatarResult, targetAvatarResult] = await Promise.all([
                client.query('SELECT username FROM users WHERE id = $1', [currentUserId]),
                client.query('SELECT username FROM users WHERE id = $1', [targetUserId]),
                client.query('SELECT url FROM images WHERE user_id = $1 ORDER BY is_avatar DESC, id ASC LIMIT 1', [currentUserId]),
                client.query('SELECT url FROM images WHERE user_id = $1 ORDER BY is_avatar DESC, id ASC LIMIT 1', [targetUserId]),
            ])

            const currentUsername = currentUserResult.rows[0]?.username ?? `User ${currentUserId}`
            const targetUsername = targetUserResult.rows[0]?.username ?? `User ${targetUserId}`
            const currentAvatar = currentAvatarResult.rows?.[0]?.url
            const targetAvatar = targetAvatarResult.rows?.[0]?.url

            await client.query('BEGIN')

            await client.query(
                'INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [currentUserId, userId]
            );

            const likeNotification = await insertNotification(
                client,
                targetUserId,
                'like',
                `${currentUsername} liked your profile.`,
                Number(currentUserId),
            )

            const matchResult = await client.query(
                'SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = $2',
                [userId, currentUserId]
            );

            if (matchResult.rowCount && matchResult.rowCount > 0) {
                isMatch = true;
                await client.query(
                    'INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2)',
                    [currentUserId, userId]
                );

                // Create conversation automatically when match happens
                await client.query(
                    'INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [currentUserId, userId]
                );

                const matchNotificationForCurrent = await insertNotification(
                    client,
                    Number(currentUserId),
                    'match',
                    `You matched with ${targetUsername}.`,
                    targetUserId,
                )
                const matchNotificationForTarget = await insertNotification(
                    client,
                    targetUserId,
                    'match',
                    `You matched with ${currentUsername}.`,
                    Number(currentUserId),
                )

                pendingMatchNotifications = []

                if (matchNotificationForCurrent) {
                    pendingMatchNotifications.push({
                        userId: Number(currentUserId),
                        payload: {
                            id: matchNotificationForCurrent.id,
                            type: 'match',
                            from: targetUserId,
                            message: matchNotificationForCurrent.message,
                            createdAt: matchNotificationForCurrent.createdAt,
                            actorId: targetUserId,
                            actorUsername: targetUsername,
                            actorAvatar: targetAvatar,
                        },
                    })
                }

                if (matchNotificationForTarget) {
                    pendingMatchNotifications.push({
                        userId: targetUserId,
                        payload: {
                            id: matchNotificationForTarget.id,
                            type: 'match',
                            from: currentUserId,
                            message: matchNotificationForTarget.message,
                            createdAt: matchNotificationForTarget.createdAt,
                            actorId: Number(currentUserId),
                            actorUsername: currentUsername,
                            actorAvatar: currentAvatar,
                        },
                    })
                }
            }
            
            await client.query('COMMIT')

            if (likeNotification) {
                io.to(String(targetUserId)).emit('notification', {
                    id: likeNotification.id,
                    type: 'like',
                    from: currentUserId,
                    message: likeNotification.message,
                    createdAt: likeNotification.createdAt,
                    actorId: Number(currentUserId),
                    actorUsername: currentUsername,
                    actorAvatar: currentAvatar,
                })
            }

            pendingMatchNotifications.forEach((item) => {
                io.to(String(item.userId)).emit('notification', item.payload)
            })
        }
        catch (error) {
            await client.query('ROLLBACK')
            console.error('Error liking user:', error)
            throw new Error('Failed to like user')
        }
        finally {
            client.release()
        }

        
        res.status(200).json({ message: 'User liked successfully', isMatch })
    }
    ,
    // swipe left
    unlikeUser: async (req: Request, res: Response) => {
        const client = await pool.connect()
        try
        {
            const { userId } = req.params
            const currentUserId = req.user?.userId
            const targetUserId = Number(userId)

            await client.query('BEGIN')

            await client.query(
                'DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2',
                [currentUserId, targetUserId]
            );

            await client.query(
                'INSERT INTO UNLIKES (unliker_id, unliked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [currentUserId, targetUserId]
            );

            await client.query(
                `
                DELETE FROM matches
                WHERE (user1_id = $1 AND user2_id = $2)
                   OR (user1_id = $2 AND user2_id = $1)
                `,
                [Number(currentUserId), targetUserId],
            )

            await client.query(
                `
                DELETE FROM conversations
                WHERE (user1_id = $1 AND user2_id = $2)
                   OR (user1_id = $2 AND user2_id = $1)
                `,
                [Number(currentUserId), targetUserId],
            )

            await client.query('COMMIT')
        }
        catch (error) {
            await client.query('ROLLBACK')
            console.error('Error unliking user:', error)
            throw new Error('Failed to unlike user')
        }
        finally {
            client.release()
        }
        res.status(200).json({ message: 'User unliked successfully' })
    }
    ,
    // saw profile
    viewUser: async (req: Request, res: Response) => {
        const client = await pool.connect()

        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId
            const targetUserId = Number(userId)

            if (!currentUserId || !targetUserId) {
                res.status(400).json({ message: 'Invalid users for view operation' })
                return
            }

            const blocked = await isBlockedBetween(client, Number(currentUserId), targetUserId)
            if (blocked) {
                res.status(403).json({ message: 'Cannot view user while blocked' })
                return
            }

            const currentUserResult = await client.query('SELECT username FROM users WHERE id = $1', [currentUserId])
            const currentAvatarResult = await client.query('SELECT url FROM images WHERE user_id = $1 ORDER BY is_avatar DESC, id ASC LIMIT 1', [currentUserId])
            const currentUsername = currentUserResult.rows[0]?.username ?? `User ${currentUserId}`
            const currentAvatar = currentAvatarResult.rows[0]?.url

            await client.query('BEGIN')

            await client.query(
                `
                INSERT INTO views (viewer_id, viewed_id)
                VALUES ($1, $2)
                ON CONFLICT (viewer_id, viewed_id)
                DO UPDATE SET updated_at = now()
                `,
                [currentUserId, userId]
            );

            const upsertedNotification = await client.query(
                `
                UPDATE notifications
                SET
                    message = $1,
                    is_read = FALSE,
                    created_at = now(),
                    updated_at = now()
                WHERE user_id = $2 AND actor_id = $3 AND type = 'view'
                RETURNING id, created_at AS "createdAt", message
                `,
                [`${currentUsername} viewed your profile.`, targetUserId, Number(currentUserId)],
            ) as { rows: Array<{ id: number; createdAt: string; message: string }> }

            const viewNotification = upsertedNotification.rows[0] ?? await insertNotification(
                client,
                targetUserId,
                'view',
                `${currentUsername} viewed your profile.`,
                Number(currentUserId),
            )

            await client.query('COMMIT')

            if (viewNotification) {
                io.to(String(targetUserId)).emit('notification', {
                    id: viewNotification.id,
                    type: 'view',
                    from: currentUserId,
                    message: viewNotification.message,
                    createdAt: viewNotification.createdAt,
                    actorId: Number(currentUserId),
                    actorUsername: currentUsername,
                    actorAvatar: currentAvatar,
                })
            }
        }
        catch (error) {
            await client.query('ROLLBACK')
            console.error('Error viewing user:', error)
            throw new Error('Failed to view user')
        }
        finally {
            client.release()
        }
        res.status(200).json({ message: 'User viewed successfully' })
    }
    ,
    blockUser: async (req: Request, res: Response) => {
        const client = await pool.connect()
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId
            const targetUserId = Number(userId)

            await client.query('BEGIN')

            await client.query(
                'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [currentUserId, targetUserId]
            );

            await client.query(
                'DELETE FROM likes WHERE (liker_id = $1 AND liked_id = $2) OR (liker_id = $2 AND liked_id = $1)',
                [currentUserId, targetUserId],
            )

            await client.query(
                `
                DELETE FROM matches
                WHERE (user1_id = $1 AND user2_id = $2)
                   OR (user1_id = $2 AND user2_id = $1)
                `,
                [Number(currentUserId), targetUserId],
            )

            await client.query(
                `
                DELETE FROM conversations
                WHERE (user1_id = $1 AND user2_id = $2)
                   OR (user1_id = $2 AND user2_id = $1)
                `,
                [Number(currentUserId), targetUserId],
            )

            await client.query('COMMIT')
        }
        catch (error) {
            await client.query('ROLLBACK')
            console.error('Error blocking user:', error)
            throw new Error('Failed to block user')
        }
        finally {
            client.release()
        }
        res.status(200).json({ message: 'User blocked successfully' })
    }
    ,
    unblockUser: async (req: Request, res: Response) => {
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId

            await pool.query(
                'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
                [currentUserId, userId]
            );
        }
        catch (error) {
            console.error('Error unblocking user:', error)
            throw new Error('Failed to unblock user')
        }
        res.status(200).json({ message: 'User unblocked successfully' })
    }
    ,
    reportUser: async (req: Request, res: Response) => {
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId
            const { reason } = req.body
            const normalizedReason = typeof reason === 'string' && reason.trim().length > 0
                ? reason.trim()
                : 'No reason provided'

            await pool.query(
                'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
                [currentUserId, userId, normalizedReason]
            );
        }
        catch (error) {
            console.error('Error reporting user:', error)
            throw new Error('Failed to report user')
        }
        res.status(200).json({ message: 'User reported successfully' })
    }
    ,
    // this is related to removing like, we stop notification and chats;
    removeLike: async (req: Request, res: Response) => {
        const client = await pool.connect()
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId
            const targetUserId = Number(userId)

            await client.query('BEGIN')

            await client.query(
                'DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2',
                [currentUserId, targetUserId]
            );

            await client.query(
                `
                DELETE FROM matches
                WHERE (user1_id = $1 AND user2_id = $2)
                   OR (user1_id = $2 AND user2_id = $1)
                `,
                [Number(currentUserId), targetUserId],
            )

            await client.query(
                `
                DELETE FROM conversations
                WHERE (user1_id = $1 AND user2_id = $2)
                   OR (user1_id = $2 AND user2_id = $1)
                `,
                [Number(currentUserId), targetUserId],
            )

            await client.query('COMMIT')
        }
        catch (error) {
            await client.query('ROLLBACK')
            console.error('Error removing like:', error)
            throw new Error('Failed to remove like')
        }
        finally {
            client.release()
        }
        res.status(200).json({ message: 'Like removed successfully' })
    }
    ,
    skipUser: async (req: Request, res: Response) => {
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId

            await pool.query(
                'INSERT INTO skips (skiper_id, skiped_id) VALUES ($1, $2)',
                [currentUserId, userId]
            );
        }
        catch (error) {
            console.error('Error skipping user:', error)
            throw new Error('Failed to skip user')
        }
        res.status(200).json({ message: 'User skipped successfully' })
    }

    ,
    getRelationshipStatus: async (req: Request, res: Response) => {
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId
            const targetUserId = Number(userId)

            if (!currentUserId || !targetUserId) {
                res.status(400).json({ message: 'Invalid user id' })
                return
            }

            const relationResult = await pool.query(
                `
                SELECT
                    EXISTS (
                        SELECT 1 FROM likes
                        WHERE liker_id = $1 AND liked_id = $2
                    ) AS "iLike",
                    EXISTS (
                        SELECT 1 FROM likes
                        WHERE liker_id = $2 AND liked_id = $1
                    ) AS "likesMe",
                    EXISTS (
                        SELECT 1 FROM matches
                        WHERE (user1_id = $1 AND user2_id = $2)
                           OR (user1_id = $2 AND user2_id = $1)
                    ) AS "isMatched",
                    EXISTS (
                        SELECT 1 FROM blocks
                        WHERE blocker_id = $1 AND blocked_id = $2
                    ) AS "iBlocked",
                    EXISTS (
                        SELECT 1 FROM blocks
                        WHERE blocker_id = $2 AND blocked_id = $1
                    ) AS "blockedMe",
                    (
                        SELECT id FROM conversations
                        WHERE (user1_id = $1 AND user2_id = $2)
                           OR (user1_id = $2 AND user2_id = $1)
                        ORDER BY id DESC
                        LIMIT 1
                    ) AS "conversationId"
                `,
                [Number(currentUserId), targetUserId],
            )

            const row = relationResult.rows[0] ?? {}

            res.status(200).json({
                iLike: Boolean(row.iLike),
                likesMe: Boolean(row.likesMe),
                isMatched: Boolean(row.isMatched),
                iBlocked: Boolean(row.iBlocked),
                blockedMe: Boolean(row.blockedMe),
                conversationId: row.conversationId ? Number(row.conversationId) : null,
            })
        } catch (error) {
            console.error('Error getting relationship status:', error)
            res.status(500).json({ message: 'Failed to get relationship status' })
        }
    }

}