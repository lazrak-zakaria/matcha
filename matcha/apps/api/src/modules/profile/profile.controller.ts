
import bcrypt from 'bcrypt'
import type { Request, Response } from "express";
import pool from "../../config/db";
import { env } from '../../config/env/env';
import z from 'zod';
import { checkUniqueViolation } from '../auth/auth.controller';
import { get } from 'node:http';
import { is } from 'zod/locales';



const profileController = {
    getProfile: async (req: Request, res: Response) => {
        const { userId } = req.params;
        try {
            const result = await pool.query(
                `SELECT id, username, email, first_name AS "firstName", last_name AS "lastName", bio, gender FROM users WHERE id = $1`,
                [userId]
            )

            if (result.rows.length === 0) {
                res.status(404).json({ message: 'User not found' });
                return
            }

            if (result.rows[0].id !== req.user?.userId) {
                delete result.rows[0].email;
            }

            res.status(200).json(result.rows[0]);
        }
        catch (error) {
            console.error('Error fetching profile:', error);
            res.status(500).json({ message: 'Failed to fetch profile' });
        }
    },


    updateProfile: async (req: Request, res: Response) => {
        try {
            const { age, bio, gender } = req.body;
            const userId = req.user?.userId;

            await pool.query(
                `UPDATE users SET age = $1, bio = $2, gender = $3 WHERE id = $4`,
                [age, bio, gender, userId]
            )
            res.status(200).json({
                message: 'Profile updated successfully',
                user: { id: userId, age, bio, gender }
            })
        }
        catch (error) {
            console.error('Error updating profile:', error)
            res.status(500).json({ message: 'Failed to update profile' })
        }
    },

    getTags: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                `SELECT t.id as "id", t.name as "name" FROM tags t JOIN user_tags ut ON t.id = ut.tag_id WHERE ut.user_id = $1`,
                [req.user?.userId]
            )
            console.log('Fetched tags for user:', req.user?.userId, result.rows);
            res.status(200).json(result.rows)
        }
        catch (error) {
            console.error('Error fetching tags:', error)
            res.status(500).json({ message: 'Failed to fetch tags' })
        }
    },

    getAllTags: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                `SELECT id, name FROM tags`
            )
            res.status(200).json(result.rows)
        }
        catch (error) {
            console.error('Error fetching all tags:', error)
            res.status(500).json({ message: 'Failed to fetch all tags' })
        }
    },

    getTagsAggregated: async (req: Request, res: Response) => {
        try {
            console.log('Fetching aggregated tags for user:', req.user?.userId);
            const usedTags = await pool.query(
                `SELECT t.id as "id", t.name as "name" FROM tags t JOIN user_tags ut ON t.id = ut.tag_id WHERE ut.user_id = $1`,
                [req.user?.userId]
            )
            const allTags = await pool.query(
                `SELECT id, name FROM tags`
            )
            const usedTagIds = new Set(usedTags.rows.map((tag: any) => tag.id))
            const aggregatedTags = allTags.rows.map((tag: any) => ({
                id: tag.id,
                name: tag.name,
                selected: usedTagIds.has(tag.id)
            }))
            res.status(200).json(aggregatedTags)
        }
        catch (error) {
            console.error('Error fetching aggregated tags:', error)
            res.status(500).json({ message: 'Failed to fetch aggregated tags' })
        }
    },

    getTagsPreferencesAggregated: async (req: Request, res: Response) => {
        try {
            console.log('Fetching aggregated tag preferences for user:', req.user?.userId);
            const usedTags = await pool.query(
                `SELECT t.id as "id", t.name as "name" FROM tags t JOIN user_search_preference_tags utp ON t.id = utp.tag_id WHERE utp.user_id = $1`,
                [req.user?.userId]
            )
            const allTags = await pool.query(
                `SELECT id, name FROM tags`
            )
            const usedTagIds = new Set(usedTags.rows.map((tag: any) => tag.id))
            const aggregatedTags = allTags.rows.map((tag: any) => ({
                id: tag.id,
                name: tag.name,
                selected: usedTagIds.has(tag.id)
            }))
            res.status(200).json(aggregatedTags)
        }
        catch (error) {
            console.error('Error fetching aggregated tag preferences:', error)
            res.status(500).json({ message: 'Failed to fetch aggregated tag preferences' })
        }
    },
    updateTags: async (req: Request, res: Response) => {
        const { tagIds } = req.body

        try {

            const userId = req.user?.userId;

            await pool.query('BEGIN')

            await pool.query(
                'DELETE FROM user_tags WHERE user_id = $1',
                [userId]
            )

            const insertValues = tagIds.map((tagId: number) => `(${userId}, ${tagId})`).join(', ')
            if (insertValues) {
                await pool.query(
                    `INSERT INTO user_tags (user_id, tag_id) VALUES ${insertValues}`
                )
            }

            await pool.query('COMMIT');
            res.status(200).json({ message: 'Tags updated successfully' });
        }
        catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error updating tags:', error);
            res.status(400).json({ message: 'Failed to update tags: possible tag does not exist' });
        }
    }
    ,
    updatePassword: async (req: Request, res: Response) => {


        try {
            const { currentPassword, newPassword } = req.body

            const userId = req.user?.userId;

            const result = await pool.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            )

            const user = result.rows[0]

            const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash)
            if (!passwordMatch) {
                res.status(400).json({ message: 'Current password is incorrect' })
                return
            }

            const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS)

            await pool.query(
                'UPDATE users SET password_hash = $1 WHERE id = $2',
                [hashedPassword, req.user?.userId]
            )

            res.status(200).json({ message: 'Password updated successfully' })
        }
        catch (error) {
            console.error('Error updating password:', error)
            res.status(500).json({ message: 'Failed to update password' })
        }
    },
    getLikes: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                `SELECT u.id,
                        u.username,
                        u.first_name AS "firstName",
                        u.last_name AS "lastName",
                        a.url AS "avatar"
                 FROM likes l
                 JOIN users u ON l.liker_id = u.id
                 LEFT JOIN LATERAL (
                    SELECT i.url
                    FROM images i
                    WHERE i.user_id = u.id AND i.is_avatar = TRUE
                    ORDER BY i.created_at DESC
                    LIMIT 1
                 ) a ON TRUE
                 WHERE l.liked_id = $1
                 ORDER BY l.created_at DESC
                 LIMIT 5`,
                [req.user?.userId]
            )
            res.status(200).json(result.rows)
        }
        catch (error) {
            console.error('Error fetching likes:', error)
            res.status(500).json({ message: 'Failed to fetch likes' })
        }
    },
    getMatches: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                                `SELECT u.id,
                                                u.username,
                                                u.first_name AS "firstName",
                                                u.last_name AS "lastName",
                                                a.url AS "avatar"
                 FROM matches m
                 JOIN users u ON (m.user1_id = u.id OR m.user2_id = u.id)
                                 LEFT JOIN LATERAL (
                                        SELECT i.url
                                        FROM images i
                                        WHERE i.user_id = u.id AND i.is_avatar = TRUE
                                        ORDER BY i.created_at DESC
                                        LIMIT 1
                                 ) a ON TRUE
                 WHERE (m.user1_id = $1 OR m.user2_id = $1)
                   AND u.id != $1
                 ORDER BY m.created_at DESC
                 LIMIT 5`,
                [req.user?.userId]
            )
            res.status(200).json(result.rows)
        }
        catch (error) {
            console.error('Error fetching matches:', error)
            res.status(500).json({ message: 'Failed to fetch matches' })
        }
    }
    ,
    getViews: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                `SELECT u.id,
                        u.username,
                        u.first_name AS "firstName",
                        u.last_name AS "lastName",
                        a.url AS "avatar"
                 FROM views v
                 JOIN users u ON v.viewer_id = u.id
                 LEFT JOIN LATERAL (
                    SELECT i.url
                    FROM images i
                    WHERE i.user_id = u.id AND i.is_avatar = TRUE
                    ORDER BY i.created_at DESC
                    LIMIT 1
                 ) a ON TRUE
                 WHERE v.viewed_id = $1
                 ORDER BY v.created_at DESC
                 LIMIT 5`,
                [req.user?.userId]
            )
            res.status(200).json(result.rows)
        }
        catch (error) {
            console.error('Error fetching views:', error)
            res.status(500).json({ message: 'Failed to fetch views' })
        }
    }
    ,
    updateLocation: async (req: Request, res: Response) => {
        try {
            const { latitude, longitude } = req.body
            await pool.query(
                'UPDATE users SET latitude = $1, longitude = $2 WHERE id = $3',
                [latitude, longitude, req.user?.userId]
            )
            res.status(200).json({ message: 'Location updated successfully' })
        }
        catch (error) {
            console.error('Error updating location:', error)
            res.status(500).json({ message: 'Failed to update location' })
        }
    },
    updateSearchPreferences: async (req: Request, res: Response) => {
        let transactionStarted = false
        try {
            const parsed = z.object({
                minAge: z.coerce.number().int().min(18).max(120),
                maxAge: z.coerce.number().int().min(18).max(120),
                minFameRating: z.coerce.number().min(0).max(5).transform((value) => Math.round(value)),
                maxFameRating: z.coerce.number().min(0).max(5).transform((value) => Math.round(value)),
                locationRadiusKm: z.coerce.number().int().min(5).max(500),
                tagIds: z.array(z.coerce.number().int().positive()).optional().default([]),
            })
                .refine((data) => data.minAge <= data.maxAge, {
                    message: 'minAge must be less than or equal to maxAge',
                    path: ['minAge'],
                })
                .refine((data) => data.minFameRating <= data.maxFameRating, {
                    message: 'minFameRating must be less than or equal to maxFameRating',
                    path: ['minFameRating'],
                })
                .parse(req.body)
            console.log('Parsed search preferences:', parsed);
            const { minAge, maxAge, minFameRating, maxFameRating, locationRadiusKm, tagIds } = parsed

            const userId =req.user?.userId;

            await pool.query('BEGIN')
            transactionStarted = true

            await pool.query(
                `INSERT INTO user_search_preferences (user_id, min_age, max_age, min_fame_rating, max_fame_rating, location_radius_km)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (user_id) DO UPDATE SET
                    min_age = EXCLUDED.min_age,
                    max_age = EXCLUDED.max_age,
                    min_fame_rating = EXCLUDED.min_fame_rating,
                    max_fame_rating = EXCLUDED.max_fame_rating,
                    location_radius_km = EXCLUDED.location_radius_km
                `,
                [userId, minAge, maxAge, minFameRating, maxFameRating, locationRadiusKm]
            )

            await pool.query(
                `DELETE FROM user_search_preference_tags WHERE user_id = $1`,
                [userId]
            )

            if (tagIds.length > 0) {
                await pool.query(
                    `INSERT INTO user_search_preference_tags (user_id, tag_id)
                     SELECT $1, unnest($2::int[])`,
                    [userId, tagIds]
                )
            }

            await pool.query('COMMIT')
            transactionStarted = false
            res.status(200).json({ message: 'Search preferences updated successfully' })
        }
        catch (error) {
            if (transactionStarted) {
                await pool.query('ROLLBACK')
            }
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: 'Invalid search preferences payload',
                    details: error.flatten(),
                })
                return
            }
            console.error('Error updating search preferences:', error)
            res.status(500).json({ message: 'Failed to update search preferences' })
        }
    },


    getSearchPreferences: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                `SELECT min_age AS "minAge", max_age AS "maxAge", min_fame_rating AS "minFameRating", max_fame_rating AS "maxFameRating", preferred_gender AS "preferredGender", location_radius_km AS "locationRadiusKm" FROM user_search_preferences WHERE user_id = $1`,
                [req.user?.userId]
            )
            if (result.rows.length === 0) {
                const data = {
                    minAge: 18,
                    maxAge: 120,
                    minFameRating: 0,
                    maxFameRating: 5,
                    preferredGender: 'any',
                    locationRadiusKm: 100
                }
                res.status(200).json(data)
                return
            }
            res.status(200).json(result.rows[0])
        }
        catch (error) {
            console.error('Error fetching search preferences:', error)
            res.status(500).json({ message: 'Failed to fetch search preferences' })
        }
    },


    // i only update first name, last name, username
    // i validate body in router
    updateAccount: async (req: Request, res: Response) => {
        try {
            const { username, firstName, lastName } = req.body;
            const userId = req.user?.userId;

            await pool.query(
                `UPDATE users SET username = $1, first_name = $2, last_name = $3 WHERE id = $4`,
                [username, firstName, lastName, userId]
            )
            res.status(200).json({
                message: 'Account updated successfully',
                user: { id: userId, username, firstName, lastName }
            })
        }
        catch (error) {
            const uniqueViolation = checkUniqueViolation(error);
            if (uniqueViolation) {
                res.status(400).json(uniqueViolation);
                console.error("Unique constraint violation:", uniqueViolation);
                return;
            }
            console.error('Error updating account:', error)
            res.status(500).json({ message: 'Failed to update account' })
        }
    },
    updateAvatar: async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                res.status(400).json({ message: 'No file uploaded' });
                return;
            }

            const avatar = `${env.UPLOAD_DIR}${req.file.filename}`;

            await pool.query(
                `UPDATE images SET is_avatar = FALSE WHERE user_id = $1 AND is_avatar = TRUE`,
                [req.user?.userId]
            )

            await pool.query(
                `INSERT INTO images (url, user_id, is_avatar) VALUES ($1, $2, TRUE)`,
                [avatar, req.user?.userId]
            )

            res.status(200).json({
                message: 'Avatar updated successfully',
                avatar
            })
        }
        catch (error) {
            console.error('Error updating avatar:', error)
            res.status(500).json({ message: 'Failed to update avatar' })
        }
    },
    getImages: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                `SELECT id, url, is_avatar AS "isAvatar" FROM images WHERE user_id = $1`,
                [req.user?.userId]
            )
            res.status(200).json(result.rows)
        }
        catch (error) {
            console.error('Error fetching images:', error)
            res.status(500).json({ message: 'Failed to fetch images' })
        }
    },
    updateImages: async (req: Request, res: Response) => {
        try {

            const files = req.files;

            const existingImages = JSON.parse(req.body.existingImages);

            await pool.query('BEGIN')

            await pool.query(
                `DELETE FROM images WHERE user_id = $1 AND id NOT IN (${existingImages.length > 0 ? existingImages.join(',') : 'NULL'})`,
                [req.user?.userId]
            )
            if (req.body.avatarId || req.body.avatarIndex) {
                await pool.query(
                    `UPDATE images SET is_avatar = FALSE WHERE user_id = $1 AND is_avatar = TRUE`,
                    [req.user?.userId]
                )
            }

            let i = 0;
            for (const file of files as Express.Multer.File[]) {
                const imageUrl = `${env.UPLOAD_DIR}${file.filename}`;
                let isAvatar = "FALSE";
                if (req.body.avatarIndex) {
                    const avatarIndex = parseInt(req.body.avatarIndex);
                    if (i === avatarIndex) {
                        isAvatar = "TRUE";
                    }
                }

                await pool.query(
                    `INSERT INTO images (url, user_id, is_avatar) VALUES ($1, $2, $3)`,
                    [imageUrl, req.user?.userId, isAvatar]
                )
                ++i;
            }

            if (req.body.avatarId) {
                const avatarId = parseInt(req.body.avatarId);
                await pool.query(
                    `UPDATE images SET is_avatar = TRUE WHERE id = $1 AND user_id = $2`,
                    [avatarId, req.user?.userId]
                )
            }

            await pool.query('COMMIT');

            const avatar = await pool.query(
                `SELECT id, url FROM images WHERE user_id = $1 AND is_avatar = TRUE`,
                [req.user?.userId]
            )

            res.status(201).json({
                message: 'Images updated successfully',
                avatar: avatar.rows[0] ? avatar.rows[0].url : null
            });
        }
        catch (error) {
            console.error('Error updating images:', error)
            res.status(500).json({ message: 'Failed to update images' })
        }
    },
    
}   

export default profileController
export { profileController }