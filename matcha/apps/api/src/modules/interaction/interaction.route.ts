import { Router } from "express"
import { likesController } from "./interaction.controller"
import { requireAuth } from "../../middleware/auth"



const interactionRouter : Router = Router()

interactionRouter.get('/status/:userId', requireAuth, likesController.getRelationshipStatus)
interactionRouter.post('/like/:userId', requireAuth ,likesController.likeUser)
interactionRouter.post('/unlike/:userId', requireAuth, likesController.unlikeUser)
interactionRouter.post('/remove-like/:userId', requireAuth, likesController.removeLike)
interactionRouter.post('/view/:userId', requireAuth ,likesController.viewUser)
interactionRouter.post('/skip/:userId', requireAuth ,likesController.skipUser)
interactionRouter.post('/block/:userId', requireAuth, likesController.blockUser)
interactionRouter.post('/unblock/:userId', requireAuth, likesController.unblockUser)
interactionRouter.post('/report/:userId', requireAuth ,likesController.reportUser)

export default interactionRouter;
export {interactionRouter}