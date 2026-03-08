
import bcrypt from 'bcrypt'
import type { Request, Response } from "express";
import pool from "../../config/db";
import { env } from '../../config/env/env';
import z from 'zod';



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
            const { username, firstName, lastName, bio, gender } = req.body;
            const userId = z.coerce.number().parse(req.params.userId);

            if (userId !== req.user?.userId) {
                res.status(403).json({ message: 'Forbidden: You can only update your own profile' });
                return;
            }

            await pool.query(
                `UPDATE users SET username = $1, first_name = $2, last_name = $3, bio = $4, gender = $5 WHERE id = $6`,
                [username, firstName, lastName, bio, gender, userId]
            )
            res.status(200).json({ message: 'Profile updated successfully',
                user: { id: userId, username, firstName, lastName, bio, gender }
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
            res.status(200).json(result.rows)
        }
        catch (error) {
            console.error('Error fetching tags:', error)
            res.status(500).json({ message: 'Failed to fetch tags' })
        }
    },

    updateTags: async (req: Request, res: Response) => {
        const { tagIds } = req.body

        try {

            const userId = z.coerce.number().parse(req.params.userId);
            if (userId !== req.user?.userId) {
                res.status(403).json({ message: 'Forbidden: You can only update your own tags' });
                return;
            }

            await pool.query('BEGIN')

            await pool.query(
                'DELETE FROM user_tags WHERE user_id = $1',
                [req.user?.userId]
            )

            const insertValues = tagIds.map((tagId: number) => `(${req.user?.userId}, ${tagId})`).join(', ')
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

            const userId = z.coerce.number().parse(req.params.userId);
            if (userId !== req.user?.userId) {
                res.status(403).json({ message: 'Forbidden: You can only update your own password' });
                return;
            }

            const result = await pool.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            )

            if (result.rows.length === 0) {
                res.status(404).json({ message: 'User not found' })
                return
            }

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
                `SELECT u.id, u.username FROM likes l JOIN users u ON l.liker_id = u.id WHERE l.liked_id = $1`,
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
                `SELECT u.id, u.username FROM matches m JOIN users u ON (m.user1_id = u.id OR m.user2_id = u.id) WHERE (m.user1_id = $1 OR m.user2_id = $1) AND u.id != $1`,
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
    getviews: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                `SELECT u.id, u.username FROM views v JOIN users u ON v.viewer_id = u.id WHERE v.viewed_id = $1`,
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

}


export default profileController
export { profileController }