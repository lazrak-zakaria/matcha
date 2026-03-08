import { Router } from "express"
import { likesController } from "./interaction.controller"
import { requireAuth } from "../../middleware/auth"



const likesRouter : Router = Router()

likesRouter.post('/like/:userId', requireAuth ,likesController.likeUser)

export default likesRouter;
export {likesRouter}