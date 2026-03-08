
import type { Request, Response } from 'express'
import { io } from '../../app.js'
import { pool } from '../../config/db/index.js'
import { fi } from 'zod/locales';



const insertNotification = async (userId: number, type: string, content: string) => {
    await pool.query(
        'INSERT INTO notifications (user_id, type, content) VALUES ($1, $2, $3)',
        [userId, type, content]
    );
}


export const likesController = {


    // swip right
    likeUser: async (req: Request, res: Response) => {
        const client = await pool.connect()
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId

            await client.query('BEGIN')

            await client.query(
                'INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2)',
                [currentUserId, userId]
            );

            await client.query(
                'INSERT INTO notifications (user_id, type, content) VALUES ($1, $2, $3)',
                [userId, 'like', `User ${currentUserId} liked your profile.`]
            );

            const matchResult = await client.query(
                'SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = $2',
                [userId, currentUserId]
            );

            if (matchResult.rowCount && matchResult.rowCount > 0) {
                await client.query(
                    'INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2)',
                    [currentUserId, userId]
                );
                await client.query(
                    'INSERT INTO notifications (user_id, type, content) VALUES ($1, $2, $3), ($4, $5, $6)',
                    [currentUserId, 'match', `You matched with user ${userId}.`, userId, 'match', `You matched with user ${currentUserId}.`]
                );
            }
            await client.query('COMMIT')

            // Emit a notification to the liked user
        }
        catch (error) {
            await client.query('ROLLBACK')
            console.error('Error liking user:', error)
            throw new Error('Failed to like user')
        }
        finally {
            client.release()
        }
        res.status(200).json({ message: 'User liked successfully' })
    }
    ,
    // swipe left
    unlikeUser: async (req: Request, res: Response) => {
        try
        {
            const { userId } = req.params
            const currentUserId = req.user?.userId

            await pool.query(
                'INSERT INTO UNLIKES (unliker_id, unliked_id) VALUES ($1, $2)',
                [currentUserId, userId]
            );
        }
        catch (error) {
            console.error('Error unliking user:', error)
            throw new Error('Failed to unlike user')
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

            await client.query('BEGIN')

            await pool.query(
                'INSERT INTO views (viewer_id, viewed_id) VALUES ($1, $2)',
                [currentUserId, userId]
            );
            await client.query(
                'INSERT INTO notifications (user_id, type, content) VALUES ($1, $2, $3)',
                [userId, 'view', `User ${currentUserId} viewed your profile.`]
            );

            await client.query('COMMIT')
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
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId

            await pool.query(
                'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)',
                [currentUserId, userId]
            );
        }
        catch (error) {
            console.error('Error blocking user:', error)
            throw new Error('Failed to block user')
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

            await pool.query(
                'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
                [currentUserId, userId, reason]
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
        try {
            const { userId } = req.params
            const currentUserId = req.user?.userId

            await pool.query(
                'DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2',
                [currentUserId, userId]
            );
        }
        catch (error) {
            console.error('Error removing like:', error)
            throw new Error('Failed to remove like')
        }
        res.status(200).json({ message: 'Like removed successfully' })
    }


}