
import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './modules/auth/auth.route'
import { Server } from 'socket.io'
import { createServer } from 'node:http';
import { verifyToken } from './lib/jwt';
import { sendLikeNotification } from './socket/events/notification';
import { connectEvent } from './socket/events/connect';
import { env } from './config/env/env';
import { profileRouter } from './modules/profile/profile.router';
import { browsingRouter } from './modules/browsing/browsing.router';
import { requireAuth } from './middleware/auth';
import cors from 'cors';

const app: express.Application = express();


const server = createServer(app);


const io = new Server(server, {
    cors: {
        origin: env.WEB_URL,
        credentials: true,
    }
});

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: env.WEB_URL,
    credentials: true,
}))     

io.use((socket, next) => {
    const authHeader = socket.handshake.headers.authorization;

    console.log('Socket authentication attempt with auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const err = new Error('Authentication error: no token');
        (err as any).data = { status: 401, message: 'Authentication error: no token' };
        return next(err);
    }

    const token = authHeader.substring(7);

    try {
        const user = verifyToken(token);
        socket.data.user = user;
        next();
    } catch {
        const err = new Error('Authentication error: invalid token');
        (err as any).data = { status: 401, message: 'Authentication error: invalid token' };
        next(err);
    }
})





connectEvent();

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/browsing', requireAuth, browsingRouter);


app.get('/health', (req, res) => {
    sendLikeNotification(1, 1) // Example notification for testing
    res.status(200).json({ message: 'API is healthy' })
})



export default app
export { app, io, server }



