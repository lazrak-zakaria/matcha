import { io } from "../../app";



const sendLikeNotification = (from: number, to: number) => {
    console.log(`Sending like notification from user ${from} to user ${to}`);
    io.to(to.toString()).emit('notification', {
        type: 'like',
        from,
        message: `User ${from} liked you`
    })
}

const sendMatchNotification = (from: number, to: number) => {
    io.to(to.toString()).emit('notification', {
        type: 'match',
        from,
        message: `You have a new match with user ${from}`
    })
    io.to(from.toString()).emit('notification', {
        type: 'match',
        from,
        message: `You have a new match with user ${from}`
    })
}

const sendMessageNotification = (from: number, to: number, message: string) => {
    io.to(to.toString()).emit('notification', {
        type: 'message',
        from,
        message: `New message from user ${from}: ${message}`
    })
}

export { sendLikeNotification, sendMatchNotification, sendMessageNotification}
