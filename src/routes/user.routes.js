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

router.route("/update/password").put(authMiddleware, updateUserPassword);
router.route("/update/details").put(authMiddleware, updateAccountDetails);
router
  .route("/update/avatar")
  .put(authMiddleware, upload.single("avatar"), updateUserAvatar);
router
  .route("/update/coverImage")
  .put(authMiddleware, upload.single("coverImage"), updateUserCoverImage);

export default router;
