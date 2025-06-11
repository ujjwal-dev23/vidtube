import { Like } from "../models/like.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Video } from "../models/video.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // Total video count and views
  const videoStatsPromise = Video.aggregate([
    {
      $match: {
        owner: req.user?._id,
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: {
          $sum: 1,
        },
        viewCount: {
          $sum: "$views",
        },
      },
    },
  ]);

  // Total Subscribers
  const channelSubscribersCountPromise = Subscription.countDocuments({
    channel: req.user?._id,
  });

  // Total Likes
  const channelLikesCountPromise = Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $match: {
        "videoDetails.owner": req.user?._id,
      },
    },
    {
      $count: "totalLikes",
    },
  ]);

  const [videoStats, channelSubscribersCount, channelLikesCount] =
    await Promise.all([
      videoStatsPromise,
      channelSubscribersCountPromise,
      channelLikesCountPromise,
    ]);

  const responseObject = {
    totalVideos: videoStats[0]?.totalVideos || 0,
    viewCount: videoStats[0]?.viewCount || 0,
    totalSubscribers: channelSubscribersCount,
    totalLikes: channelLikesCount[0]?.totalLikes || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseObject, "Stats fetched succcessfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const paginateOptions = {
    page,
    limit,
    sort: { createdAt: -1 },
  };
  const channelVideos = await Video.paginate(
    {
      owner: req.user?._id,
    },
    paginateOptions
  );
  if (!channelVideos.totalDocs) throw new ApiError(404, "Videos not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelVideos.docs, "Videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };
