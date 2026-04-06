
import { io } from "../../app";
import { pool } from "../../config/db/index";

const socketToUser = new Map<string, number>()
const userSocketCount = new Map<number, number>()

const setUserOnlineStatus = async (userId: number, isOnline: boolean) => {
    if (isOnline) {
        await pool.query(
            `UPDATE users SET is_online = TRUE WHERE id = $1`,
            [userId],
        )
        return
    }

    await pool.query(
        `UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = $1`,
        [userId],
    )
}


export const connectEvent = () => {
    pool.query(`UPDATE users SET is_online = FALSE`)
        .catch((error) => {
            console.error('Failed to clear stale online statuses on startup:', error)
        })

    io.on('connection', (socket) => {
        const userId = Number(socket.data.user.userId)
        socket.join(userId.toString())

        socketToUser.set(socket.id, userId)
        const currentCount = userSocketCount.get(userId) ?? 0
        const nextCount = currentCount + 1
        userSocketCount.set(userId, nextCount)

        if (nextCount === 1) {
            setUserOnlineStatus(userId, true).catch((error) => {
                console.error(`Failed setting user ${userId} online:`, error)
            })
        }

        socket.on('disconnect', () => {
            const trackedUserId = socketToUser.get(socket.id)
            if (!trackedUserId) {
                return
            }

            socketToUser.delete(socket.id)
            const remainingCount = (userSocketCount.get(trackedUserId) ?? 1) - 1

            if (remainingCount <= 0) {
                userSocketCount.delete(trackedUserId)
                setUserOnlineStatus(trackedUserId, false).catch((error) => {
                    console.error(`Failed setting user ${trackedUserId} offline:`, error)
                })
                return
            }

            userSocketCount.set(trackedUserId, remainingCount)
        })
    });
}
