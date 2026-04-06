import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { notificationController } from './notification.controller.js'

const notificationRouter: Router = Router()

notificationRouter.get('/', requireAuth, notificationController.getMyNotifications)
notificationRouter.post('/read-all', requireAuth, notificationController.markAllAsRead)

export default notificationRouter
export { notificationRouter }
