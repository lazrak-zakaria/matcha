import { Router } from "express";
import browsingController from "./browsing.controller";



const browsingRouter : Router = Router()

browsingRouter.get('/users', browsingController.getUsersBypreferences)

export default browsingRouter
export {browsingRouter}


