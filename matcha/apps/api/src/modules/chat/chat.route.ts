import { Router } from 'express'
import authenticate from '../../middleware/auth'
import chatController from './chat.controller'
import { uploadAudio } from '../../config/upload/multerConfig'

const router : Router = Router()

// All routes require authentication
router.use(authenticate)

// Get all conversations for current user
router.get('/', chatController.getConversations)

// Get or create conversation with specific user
router.post('/with/:otherUserId', chatController.getOrCreateConversation)

// Get messagesfor a conversation (paginated)
router.get('/:conversationId/messages', chatController.getMessages)

// Mark all incoming messages in a conversation as read
router.post('/:conversationId/read', chatController.markConversationAsRead)

// Send a message
router.post('/:conversationId/messages', chatController.sendMessage)

// Delete a message
router.delete('/:conversationId/messages/:messageId', chatController.deleteMessage)

// Send an audio message
router.post('/:conversationId/audio', uploadAudio.single('audio'), chatController.sendAudioMessage)

export default router
export { router }
