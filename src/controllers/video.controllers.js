import { Video } from "../models/video.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { cloudinaryDelete, cloudinaryUpload } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

const getPublicId = (url) => {
  return url.split("/").pop().split(".")[0];
};

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

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
  if (!videoId) throw new ApiError(400, "Video Id is required");

  const video = await Video.findOne({
    _id: videoId,
    isPublished: true,
  });
  if (!video) throw new ApiError(404, "Video not found");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title: newTitle, description: newDescription } = req.body;

  const hasNewThumbnail = req.file && req.file.path;
  if (!newTitle && !newDescription && !hasNewThumbnail)
    throw new ApiError(
      400,
      "Atleast one field is required (title, description, thumbnail)"
    );

  const updateObject = {};
  if (newTitle) updateObject.title = newTitle;
  if (newDescription) updateObject.description = newDescription;

  let oldThumbnailUrl = "";

  if (hasNewThumbnail) {
    const videoBeforeUpdate = await Video.findOne({
      _id: videoId,
      owner: req.user?._id,
    });
    if (!videoBeforeUpdate) throw new ApiError(404, "Video not found");

    oldThumbnailUrl = videoBeforeUpdate.thumbnail;
    const newThumbnailLocalPath = req.file?.path;
    let thumbnailObj = "";
    try {
      thumbnailObj = await cloudinaryUpload(newThumbnailLocalPath);
      updateObject.thumbnail = thumbnailObj.url;
    } catch (error) {
      logger.error("Error while uploading updated Thumbnail :", error);
      throw new ApiError(
        500,
        "Something went wrong while updating the thumbnail"
      );
    }
  }

  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req.user?._id,
    },
    updateObject,
    { new: true }
  );

  if (!updatedVideo)
    throw new ApiError(404, "Video not found or missing permissions");

  if (hasNewThumbnail && oldThumbnailUrl) {
    try {
      const oldThumbnailPublicId = getPublicId(oldThumbnailUrl);
      await cloudinaryDelete(oldThumbnailPublicId);
      logger.info(`Old Thumbnail Deleted: ${oldThumbnailPublicId}`);
    } catch (error) {
      logger.error("Error deleting old thumbnail :", error);
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(404, "Video Id is required");

  const videoToDelete = await Video.findOne({
    _id: videoId,
    owner: req.user?._id,
  });

  if (!videoToDelete)
    throw new ApiError(404, "Video not found or missing permissions");

  try {
    const videoPublicId = getPublicId(videoToDelete?.videoFile);
    await cloudinaryDelete(videoPublicId, "video");

    if (videoToDelete.thumbnail) {
      const thumbnailPublicId = getPublicId(videoToDelete.thumbnail);
      await cloudinaryDelete(thumbnailPublicId);
    }
  } catch (error) {
    logger.error(
      "Error while deleting Video or Thumbnail from Cloudinary :",
      error
    );
    throw new ApiError(
      500,
      "Something went wrong while deleting Video or Thumbnail"
    );
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video Id required");

  const toggledVideo = await Video.findByIdAndUpdate(
    videoId,
    [
      {
        $set: {
          isPublished: { $not: "$isPublished" },
        },
      },
    ],
    { new: true }
  );

  if (!toggledVideo)
    throw new ApiError(
      500,
      "Something went wrong while toggling published status"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toggledVideo,
        "Publishing status changed successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
