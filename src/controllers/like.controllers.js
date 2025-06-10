import { Like } from "../models/like.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video Id required");

  const deletedLike = await Like.findOneAndDelete({
    video: videoId,
    likedBy: req.user?._id,
  });

  let responseObject = {};
  let message = "";

  if (deletedLike) {
    message = "Unliked the video sucessfully";
  } else {
    responseObject = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });
    message = "Liked the video successfully";
  }

  return res.status(200).json(new ApiResponse(200, responseObject, message));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) throw new ApiError(400, "Comment Id required");

  const deletedLike = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: req.user?._id,
  });

  let responseObject = {};
  let message = "";

  if (deletedLike) {
    message = "Unliked the comment sucessfully";
  } else {
    responseObject = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });
    message = "Liked the comment successfully";
  }

  return res.status(200).json(new ApiResponse(200, responseObject, message));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) throw new ApiError(400, "Tweet Id required");

  const deletedLike = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  let responseObject = {};
  let message = "";

  if (deletedLike) {
    message = "Unliked the tweet sucessfully";
  } else {
    responseObject = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
    message = "Liked the tweet successfully";
  }

  return res.status(200).json(new ApiResponse(200, responseObject, message));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: {
      $exists: true,
      $ne: null,
    },
  })
    .populate("video")
    .sort({ createdAt: -1 });

  if (!likedVideos.length) throw new ApiError(404, "No liked videos found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedVideos, videoCount: likedVideos.length },
        "Liked Videos fetched successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
