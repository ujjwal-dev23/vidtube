import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";
import authMiddleware from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(authMiddleware);

router
  .route("/c/:channelId")
  .get(getUserChannelSubscribers)
  .post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;
