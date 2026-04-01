import { Router } from "express"
import { likesController } from "./interaction.controller"
import { requireAuth } from "../../middleware/auth"



const interactionRouter : Router = Router()

interactionRouter.post('/like/:userId', requireAuth ,likesController.likeUser)
interactionRouter.post('/skip/:userId', requireAuth ,likesController.skipUser)
interactionRouter.post('/report/:userId', requireAuth ,likesController.reportUser)

export default interactionRouter;
export {interactionRouter}