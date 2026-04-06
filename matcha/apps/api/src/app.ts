
import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './modules/auth/auth.route'
import { Server } from 'socket.io'
import { createServer } from 'node:http';
import { verifyToken } from './lib/jwt';
import { sendLikeNotification } from './socket/events/notification';
import { connectEvent } from './socket/events/connect';
import { initMessageEvents } from './socket/events/message.js';
import { env } from './config/env/env';
import { profileRouter } from './modules/profile/profile.router';
import { browsingRouter } from './modules/browsing/browsing.router';
import { requireAuth } from './middleware/auth';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from "url";
import { Console } from 'node:console';
import { interactionRouter } from './modules/interaction/interaction.route';
import chatRouter from './modules/chat/chat.route.js';
import { notificationRouter } from './modules/notification/notification.route.js';

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
    const authToken = socket.handshake.auth?.token;
    const rawToken =
        (typeof authToken === 'string' && authToken.length > 0
            ? authToken
            : typeof authHeader === 'string'
              ? authHeader
              : '')
            .replace(/^Bearer\s+/i, '');

    console.log('Socket authentication attempt');

    if (!rawToken) {
        const err = new Error('Authentication error: no token');
        (err as any).data = { status: 401, message: 'Authentication error: no token' };
        return next(err);
    }

    try {
        const user = verifyToken(rawToken);
        socket.data.user = user;
        next();
    } catch {
        const err = new Error('Authentication error: invalid token');
        (err as any).data = { status: 401, message: 'Authentication error: invalid token' };
        next(err);
    }
})





connectEvent();
initMessageEvents();

app.use('/api/auth', authRouter);
app.use('/api/profile', requireAuth,profileRouter);
app.use('/api/users', requireAuth, browsingRouter);
app.use('/api/interactions', requireAuth, interactionRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationRouter);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  "/public/images",
  express.static(path.join(__dirname, "../public/images"))
);
app.use(
    '/public/audio',
    express.static(path.join(__dirname, '../public/audio'))
)

console.log(path.join(__dirname, "../public/images"))
app.get('/health', (req, res) => {
    sendLikeNotification(1, 1) // Example notification for testing
    res.status(200).json({ message: 'API is healthy' })
})


export default app
export { app, io, server }



