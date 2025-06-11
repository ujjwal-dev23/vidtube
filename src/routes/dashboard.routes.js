import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controllers.js";
import authMiddleware from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(authMiddleware); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router;
