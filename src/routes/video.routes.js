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
router.use(authMiddleware);

router
  .route("/")
  .post(
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

export default router;
