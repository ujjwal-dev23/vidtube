import { Video } from "../models/video.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  if (!query && !userId)
    throw new ApiError(400, "Either query or userId is required");

  const queryConditions = { isPublished: true };
  if (userId) queryConditions.owner = userId;
  if (query)
    queryConditions.$or = [
      {
        title: { $regex: query, $options: "i" },
      },
      {
        description: { $regex: query, $options: "i" },
      },
    ];

  const sortDirection = sortType.toLowerCase() === "desc" ? -1 : 1;
  const sortObject = {};
  sortObject[sortBy] = sortDirection;

  const paginateOptions = {
    page,
    limit,
    sort: sortObject,
    populate: {
      path: "owner",
      select: "username fullName avatar",
    },
  };

  const videos = await Video.paginate(queryConditions, paginateOptions);

  if (!videos.totalDocs) throw new ApiError(404, "Videos not found");

  return res
    .status(200)
    .json(new ApiResponse(200, videos.docs, "Videos fetched successfully"));
});

// Add filetype validation, Implement Duration
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title) throw new ApiError(400, "Title is required");

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  if (!videoLocalPath) throw new ApiError(400, "Video File required");
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required");

  let videoFile = "";
  try {
    videoFile = await cloudinaryUpload(videoLocalPath);
  } catch (error) {
    logger.error("Video upload error :", error);
    throw new ApiError(500, "Failed to upload video");
  }

  let thumbnail = "";
  try {
    thumbnail = await cloudinaryUpload(thumbnailLocalPath);
  } catch (error) {
    logger.error("Thumbnail upload error :", error);
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  try {
    const video = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnail.url,
      title,
      description,
      views: 0,
      duration: 0,
      owner: req.user?._id,
    });
    const createdVideo = await Video.findById(video._id);
    if (!createdVideo)
      throw new ApiError(
        500,
        "Something went wrong while publishing the video"
      );

    return res
      .status(200)
      .json(new ApiResponse(200, createdVideo, "Video published successfully"));
  } catch (error) {
    logger.error("Video creation failed :", error);
    if (videoFile) await cloudinaryDelete(videoFile.public_id);
    if (thumbnail) await cloudinaryDelete(thumbnail.public_id);
    throw new ApiError(500, "Something went wrong while publishing the video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
