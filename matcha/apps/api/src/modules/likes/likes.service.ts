import pool from "../../config/db";




export const likesSercvice = {
  likeUser: async (userId: number, likedUserId: number) => {

    try
    {
        await pool.query(
            'INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2)',
            [userId, likedUserId]
        );
    }
    catch (error)
    {
      console.error('Error liking user:', error)
      throw new Error('Failed to like user')
    }

  },
}