import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import authMiddleware from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(authMiddleware);

router.route("/:videoId").get(getVideoComments);

export default router;
