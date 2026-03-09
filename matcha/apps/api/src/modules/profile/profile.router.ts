
import { Router } from "express";
import profileController from "./profile.controller";
import { validateBody } from "../../middleware/validation";
import { userInfoUpdate } from "@repo/types/user";
import { requireAuth } from "../../middleware/auth";



const profileRouter : Router = Router();


profileRouter.get('/:userId', profileController.getProfile);
profileRouter.patch('/:userId', validateBody(userInfoUpdate) ,profileController.updateProfile);
profileRouter.get('/:userId/tags', requireAuth,profileController.getTags);
profileRouter.patch('/:userId/password', profileController.updatePassword);

export default profileRouter
export {profileRouter}