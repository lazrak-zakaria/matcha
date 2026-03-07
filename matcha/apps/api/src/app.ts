
import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './modules/auth/auth.route'


const app : express.Application = express()

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter);
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'API is healthy' })
})
export default app
export {app}



