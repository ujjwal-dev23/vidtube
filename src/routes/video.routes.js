import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controllers.js";
import authMiddleware from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";

const router = Router();

router
  .route("/")
  .post(
    authMiddleware,
    upload.fields([
      {
        name: "videoFile",
        maxcount: 1,
      },
      {
        name: "thumbnail",
        maxcount: 1,
      },
    ]),
    publishAVideo
  )
  .get(getAllVideos);

router
  .route("/:videoId")
  .get(getVideoById)
  .patch(authMiddleware, upload.single("thumbnail"), updateVideo);
router
  .route("/toggle/publish/:videoId")
  .patch(authMiddleware, togglePublishStatus);

export default router;
