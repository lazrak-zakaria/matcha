import type { Request, Response } from 'express'
import { pool } from '../../config/db/index.js'

export const notificationController = {
    getMyNotifications: async (req: Request, res: Response) => {
        try {
            const currentUserId = req.user?.userId
            const page = Math.max(1, parseInt(req.query.page as string) || 1)
            const limit = Math.max(1, parseInt(req.query.limit as string) || 20)
            const offset = (page - 1) * limit

            const [itemsResult, unreadResult] = await Promise.all([
                pool.query(
                    `
                    SELECT
                        n.id,
                        n.type,
                        n.message,
                        n.is_read AS "isRead",
                        n.created_at AS "createdAt",
                        n.actor_id AS "actorId",
                        u.username AS "actorUsername",
                        (
                            SELECT url
                            FROM images i
                            WHERE i.user_id = n.actor_id
                            ORDER BY i.is_avatar DESC, i.id ASC
                            LIMIT 1
                        ) AS "actorAvatar"
                    FROM notifications n
                    LEFT JOIN users u ON u.id = n.actor_id
                    WHERE user_id = $1
                    ORDER BY n.created_at DESC, n.id DESC
                    LIMIT $2 OFFSET $3
                    `,
                    [currentUserId, limit, offset],
                ),
                pool.query(
                    `
                    SELECT COUNT(*)::int AS count
                    FROM notifications
                    WHERE user_id = $1 AND is_read = FALSE
                    `,
                    [currentUserId],
                ),
            ])

            res.status(200).json({
                data: itemsResult.rows,
                unreadCount: unreadResult.rows[0]?.count ?? 0,
                pagination: {
                    page,
                    limit,
                },
            })
        } catch (error) {
            console.error('Error fetching notifications:', error)
            res.status(500).json({ message: 'Failed to fetch notifications' })
        }
    },

    markAllAsRead: async (req: Request, res: Response) => {
        try {
            const currentUserId = req.user?.userId
            await pool.query(
                `
                UPDATE notifications
                SET is_read = TRUE, updated_at = now()
                WHERE user_id = $1 AND is_read = FALSE
                `,
                [currentUserId],
            )

            res.status(200).json({ success: true })
        } catch (error) {
            console.error('Error marking notifications as read:', error)
            res.status(500).json({ message: 'Failed to mark notifications as read' })
        }
    },
}
