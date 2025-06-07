import {
  userRegister,
  userLogin,
  refreshAccessToken,
  userLogout,
  updateUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controllers.js";
import { Router } from "express";
import upload from "../middlewares/multer.middlewares.js";
import authMiddleware from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userRegister
);

router.route("/login").post(userLogin);
router.route("/refreshtoken").post(refreshAccessToken);
router.route("/profile/:username").get(getUserChannelProfile);

// Secured Routes
router.route("/logout").post(authMiddleware, userLogout);
router.route("/").get(authMiddleware, getCurrentUser);

router.route("/history").get(authMiddleware, getWatchHistory);

router.route("/update/password").patch(authMiddleware, updateUserPassword);
router.route("/update/details").patch(authMiddleware, updateAccountDetails);
router
  .route("/update/avatar")
  .patch(authMiddleware, upload.single("avatar"), updateUserAvatar);
router
  .route("/update/coverImage")
  .patch(authMiddleware, upload.single("coverImage"), updateUserCoverImage);

export default router;
