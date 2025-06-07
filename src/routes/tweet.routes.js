import { Router } from "express";
import authMiddleware from "../middlewares/auth.middlewares.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controllers.js";

const router = Router();

router.route("/post").post(authMiddleware, createTweet);
router.route("/:username").get(authMiddleware, getUserTweets);
router.route("/edit").patch(authMiddleware, updateTweet);
router.route("/delete/:id").delete(authMiddleware, deleteTweet);

export default router;
