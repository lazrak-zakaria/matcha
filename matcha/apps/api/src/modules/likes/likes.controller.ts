
import type { Request, Response } from 'express'
import { io } from '../../app.js'


export const likesController = {

    likeUser : async (req : Request, res : Response) => {


        const { userId } = req.params
        const currentUserId = req.user?.userId

        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }


        
        res.status(200).json({ message: 'User liked successfully' })
    }
}