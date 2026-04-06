
import { Router } from "express";
import profileController from "./profile.controller";
import { validateBody } from "../../middleware/validation";
import { userAccountUpdate, userInfoUpdate, userPasswordUpdate, userProfileUpdate } from "@repo/types/user";
import { requireAuth } from "../../middleware/auth";
import { upload } from "../../config/upload/multerConfig";



const profileRouter: Router = Router();

profileRouter.get('/likes', requireAuth, profileController.getLikes);
profileRouter.get('/views', requireAuth, profileController.getViews);
profileRouter.get('/matches', requireAuth, profileController.getMatches);
profileRouter.get('/tags', requireAuth, profileController.getTagsAggregated);
profileRouter.get('/preferences/tags', requireAuth, profileController.getTagsPreferencesAggregated);
profileRouter.get('/preferences', requireAuth, profileController.getSearchPreferences);
profileRouter.get('/:userId/questions', requireAuth, profileController.getQuestions);
profileRouter.get('/:userId/images', requireAuth, profileController.getImages);
profileRouter.get('/:userId', profileController.getProfile);
profileRouter.get('/:userId/tags', requireAuth, profileController.getTags);


profileRouter.patch('/tags', requireAuth, profileController.updateTags);
profileRouter.patch('/profile', requireAuth, validateBody(userProfileUpdate), profileController.updateProfile);
profileRouter.patch('/account', requireAuth, validateBody(userAccountUpdate), profileController.updateAccount);
profileRouter.patch('/password', requireAuth, validateBody(userPasswordUpdate), profileController.updatePassword);
profileRouter.patch('/avatar', requireAuth, upload.single('avatar'), profileController.updateAvatar);
profileRouter.patch('/questions', requireAuth, profileController.updateQuestions);
profileRouter.patch('/:userId/images', requireAuth, upload.array('images', 5), profileController.updateImages);
profileRouter.patch('/location', requireAuth, profileController.updateLocation);
profileRouter.patch('/preferences', requireAuth, profileController.updateSearchPreferences);

export default profileRouter
export { profileRouter }
