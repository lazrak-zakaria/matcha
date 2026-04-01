import { Router } from "express";
import browsingController from "./browsing.controller";
import { requireAuth } from "../../middleware/auth";



const browsingRouter : Router = Router()

browsingRouter.get('', requireAuth ,browsingController.getUsersBypreferences)

export default browsingRouter
export {browsingRouter}


