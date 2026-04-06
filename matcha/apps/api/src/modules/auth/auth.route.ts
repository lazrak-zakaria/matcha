import { Router } from "express";
import { hasRefreshToken, validateBody } from "../../middleware/validation";
import { registerSchema, loginSchema } from "@repo/types/auth"
import { authController } from "./auth.controller";



const authRouter : Router = Router();
authRouter.post('/register', validateBody(registerSchema), authController.register)
authRouter.post('/login', validateBody(loginSchema), authController.login)
authRouter.post('/refresh-token', hasRefreshToken, authController.refreshToken)
authRouter.post('/logout', authController.logout)

export default authRouter
export {authRouter}