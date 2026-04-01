import type { Request, Response } from 'express'
import { pool } from '../../config/db/index'

const browsingController = {
    getUsersBypreferences: async (req: Request, res: Response) => {
        try {
            const currentUserId = req.user?.userId
            const page = Math.max(1, parseInt(req.query.page as string) || 1)
            const pageSize = 1

            // Get total count
            const countResult = await pool.query(`
                SELECT COUNT(*) as total
                FROM users u
                JOIN users cu ON cu.id = $1
                LEFT JOIN user_search_preferences p ON p.user_id = $1
                WHERE
                    u.id != $1
                    AND NOT EXISTS (
                        SELECT 1 FROM blocks
                        WHERE (blocker_id = $1 AND blocked_id = u.id)
                           OR (blocker_id = u.id AND blocked_id = $1)
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM likes
                        WHERE liker_id = $1 AND liked_id = u.id
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM skips
                        WHERE skiper_id = $1 AND skiped_id = u.id
                    )
                    AND (p.min_age IS NULL OR u.age >= p.min_age)
                    AND (p.max_age IS NULL OR u.age <= p.max_age)
                    AND (
                        p.min_fame_rating IS NULL
                        OR u.fame_rating >= CASE
                            WHEN p.min_fame_rating <= 5 THEN p.min_fame_rating * 20
                            ELSE p.min_fame_rating
                        END
                    )
                    AND (
                        p.max_fame_rating IS NULL
                        OR u.fame_rating <= CASE
                            WHEN p.max_fame_rating <= 5 THEN p.max_fame_rating * 20
                            ELSE p.max_fame_rating
                        END
                    )
                    AND (p.preferred_gender IS NULL OR u.gender = p.preferred_gender)
                    AND (
                        p.location_radius_km IS NULL
                        OR cu.latitude IS NULL
                        OR cu.longitude IS NULL
                        OR (
                            u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                            AND 6371 * 2 * ASIN(SQRT(
                                POWER(SIN(RADIANS(cu.latitude  - u.latitude)  / 2), 2) +
                                COS(RADIANS(u.latitude)) * COS(RADIANS(cu.latitude)) *
                                POWER(SIN(RADIANS(cu.longitude - u.longitude) / 2), 2)
                            )) <= p.location_radius_km
                        )
                    )
                    AND (
                        NOT EXISTS (
                            SELECT 1 FROM user_search_preference_tags
                            WHERE user_id = p.user_id
                        )
                        OR EXISTS (
                            SELECT 1 FROM user_tags ut
                            JOIN user_search_preference_tags pt ON pt.tag_id = ut.tag_id
                            WHERE ut.user_id = u.id
                              AND pt.user_id = p.user_id
                        )
                    )
            `, [currentUserId])

            const total = parseInt(countResult.rows[0].total)
            const totalPages = Math.ceil(total / pageSize)
            const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages)
            const safeOffset = (safePage - 1) * pageSize

            const result = await pool.query(`
                SELECT
                    u.id,
                    u.username,
                    u.first_name AS "firstName",
                    u.last_name AS "lastName",
                    u.bio,
                    u.age,
                    u.gender,
                    u.fame_rating AS "fameRating",
                    u.is_online AS "isOnline",
                    u.last_seen AS "lastSeen",
                    COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object('id', t.id, 'name', t.name)
                                ORDER BY t.name
                            )
                            FROM user_tags ut
                            JOIN tags t ON t.id = ut.tag_id
                            WHERE ut.user_id = u.id
                        ),
                        '[]'::json
                    ) AS tags,
                    COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object('id', i.id, 'url', i.url, 'isAvatar', i.is_avatar)
                                ORDER BY i.is_avatar DESC, i.id ASC
                            )
                            FROM images i
                            WHERE i.user_id = u.id
                        ),
                        '[]'::json
                    ) AS photos,
                    CASE
                        WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                             AND cu.latitude IS NOT NULL AND cu.longitude IS NOT NULL
                        THEN 6371 * 2 * ASIN(SQRT(
                            POWER(SIN(RADIANS(cu.latitude  - u.latitude)  / 2), 2) +
                            COS(RADIANS(u.latitude)) * COS(RADIANS(cu.latitude)) *
                            POWER(SIN(RADIANS(cu.longitude - u.longitude) / 2), 2)
                        ))
                        ELSE NULL
                    END AS "distanceKm"
                FROM users u
                JOIN users cu ON cu.id = $1
                LEFT JOIN user_search_preferences p ON p.user_id = $1
                WHERE
                    u.id != $1
                    AND NOT EXISTS (
                        SELECT 1 FROM blocks
                        WHERE (blocker_id = $1 AND blocked_id = u.id)
                           OR (blocker_id = u.id AND blocked_id = $1)
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM likes
                        WHERE liker_id = $1 AND liked_id = u.id
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM skips
                        WHERE skiper_id = $1 AND skiped_id = u.id
                    )
                    AND (p.min_age IS NULL OR u.age >= p.min_age)
                    AND (p.max_age IS NULL OR u.age <= p.max_age)
                    AND (
                        p.min_fame_rating IS NULL
                        OR u.fame_rating >= CASE
                            WHEN p.min_fame_rating <= 5 THEN p.min_fame_rating * 20
                            ELSE p.min_fame_rating
                        END
                    )
                    AND (
                        p.max_fame_rating IS NULL
                        OR u.fame_rating <= CASE
                            WHEN p.max_fame_rating <= 5 THEN p.max_fame_rating * 20
                            ELSE p.max_fame_rating
                        END
                    )
                    AND (p.preferred_gender IS NULL OR u.gender = p.preferred_gender)
                    AND (
                        p.location_radius_km IS NULL
                        OR cu.latitude IS NULL
                        OR cu.longitude IS NULL
                        OR (
                            u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                            AND 6371 * 2 * ASIN(SQRT(
                                POWER(SIN(RADIANS(cu.latitude  - u.latitude)  / 2), 2) +
                                COS(RADIANS(u.latitude)) * COS(RADIANS(cu.latitude)) *
                                POWER(SIN(RADIANS(cu.longitude - u.longitude) / 2), 2)
                            )) <= p.location_radius_km
                        )
                    )
                    AND (
                        NOT EXISTS (
                            SELECT 1 FROM user_search_preference_tags
                            WHERE user_id = p.user_id
                        )
                        OR EXISTS (
                            SELECT 1 FROM user_tags ut
                            JOIN user_search_preference_tags pt ON pt.tag_id = ut.tag_id
                            WHERE ut.user_id = u.id
                              AND pt.user_id = p.user_id
                        )
                    )
                ORDER BY "distanceKm" NULLS LAST, u.fame_rating DESC
                LIMIT $2 OFFSET $3
            `, [currentUserId, pageSize, safeOffset])
            console.log('Fetched users by preferences:', result.rows)
            res.status(200).json({
                data: result.rows,
                pagination: {
                    page: safePage,
                    pageSize,
                    total,
                    totalPages,
                    hasNextPage: safePage < totalPages,
                    hasPrevPage: safePage > 1
                }
            })
        } catch (error) {
            console.error('Error fetching users by preferences:', error)
            res.status(500).json({ message: 'Failed to fetch users' })
        }
    }
}

export default browsingController
export { browsingController }
