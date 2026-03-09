import type { Request, Response } from 'express'
import { pool } from '../../config/db/index'

const browsingController = {
    getUsersBypreferences: async (req: Request, res: Response) => {
        try {
            const currentUserId = req.user?.userId

            const result = await pool.query(`
                SELECT
                    u.id,
                    u.username,
                    u.age,
                    u.gender,
                    u.fame_rating,
                    u.is_online,
                    u.last_seen,
                    CASE
                        WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                             AND cu.latitude IS NOT NULL AND cu.longitude IS NOT NULL
                        THEN 6371 * 2 * ASIN(SQRT(
                            POWER(SIN(RADIANS(cu.latitude  - u.latitude)  / 2), 2) +
                            COS(RADIANS(u.latitude)) * COS(RADIANS(cu.latitude)) *
                            POWER(SIN(RADIANS(cu.longitude - u.longitude) / 2), 2)
                        ))
                        ELSE NULL
                    END AS distance_km
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
                    AND (p.min_age IS NULL OR u.age >= p.min_age)
                    AND (p.max_age IS NULL OR u.age <= p.max_age)
                    AND (p.min_fame_rating IS NULL OR u.fame_rating >= p.min_fame_rating)
                    AND (p.max_fame_rating IS NULL OR u.fame_rating <= p.max_fame_rating)
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
                            WHERE preference_id = p.id
                        )
                        OR EXISTS (
                            SELECT 1 FROM user_tags ut
                            JOIN user_search_preference_tags pt ON pt.tag_id = ut.tag_id
                            WHERE ut.user_id = u.id
                              AND pt.preference_id = p.id
                        )
                    )
                ORDER BY distance_km NULLS LAST, u.fame_rating DESC
            `, [currentUserId])

            res.status(200).json(result.rows)
        } catch (error) {
            console.error('Error fetching users by preferences:', error)
            res.status(500).json({ message: 'Failed to fetch users' })
        }
    }
}

export default browsingController
export { browsingController }
