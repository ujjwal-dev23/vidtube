import { Router } from "express";
import authMiddleware from "../middlewares/auth.middlewares.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controllers.js";

const router = Router();

router.use(authMiddleware);

router.route("/").post(createTweet);
router.route("/:username").get(getUserTweets);
router.route("/:tweetId").delete(deleteTweet).patch(updateTweet);

export default router;
