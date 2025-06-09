import { Comment } from "../models/comment.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) throw new ApiError(400, "Video Id is required");

  const skipNum = (page - 1) * limit;
  const comments = await Comment.find({
    video: videoId,
  })
    .skip(skipNum)
    .limit(limit)
    .select("-video");

  if (!comments.length) throw new ApiError(404, "Comments not found");

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  if (!content) throw new ApiError(400, "Content is required");

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  const addedComment = await Comment.findById(comment._id).select("-video");

  if (!addedComment)
    throw new ApiError(500, "Something went wrong while adding the comment");

  return res
    .status(200)
    .json(new ApiResponse(200, addedComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!commentId || !content)
    throw new ApiError(400, "Comment Id and Content are required");

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: req.user?._id,
    },
    {
      $set: {
        content,
      },
    },
    { new: true }
  ).select("-video");

  if (!updatedComment)
    throw new ApiError(404, "Comment not found or missing permissions");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) throw new ApiError(400, "Comment Id required");

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user?._id,
  });

  if (!deletedComment)
    throw new ApiError(404, "Comment not found or missing permissions");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
