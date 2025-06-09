import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controllers.js";
import authMiddleware from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(authMiddleware);

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/:commentId").delete(deleteComment).patch(updateComment);

export default router;
