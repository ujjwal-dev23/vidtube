import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new ApiError(400, "Playlist Name is required");

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  const createdPlaylist = await Playlist.findById(playlist?._id);
  if (!createdPlaylist)
    throw new ApiError(500, "Something went wrong while creating the playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(200, createdPlaylist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) throw new ApiError(400, "User Id is required");

  const userPlaylists = await Playlist.find({
    owner: userId,
  });

  if (!userPlaylists.length) throw new ApiError(404, "Playlists not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "Playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) throw new ApiError(400, "Playlist Id is required");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId)
    throw new ApiError(400, "Playlist Id and Video Id are required");

  const videoToAdd = await Video.findById(videoId).select("_id").lean();
  if (!videoToAdd) throw new ApiError(404, "Video not found");

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: req.user?._id },
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) throw new ApiError(404, "Playlist not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );
});

// Maybe check logic for how to not attempt db query when video is already removed. Might be redundant though.
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId)
    throw new ApiError(400, "Playlist Id and Video Id are required");

  const videoToRemove = await Video.findById(videoId).select("_id").lean();
  if (!videoToRemove) throw new ApiError(404, "Video not found");

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: req.user?._id },
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) throw new ApiError(404, "Playlist not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) throw new ApiError(400, "Playlist Id is required");

  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user?._id,
  });
  if (!deletedPlaylist)
    throw new ApiError(404, "Playlist not found or missing permissions");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!playlistId) throw new ApiError(400, "Playlist Id is required");
  if (!name && !description)
    throw new ApiError(400, "Either name or description is required");

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user?._id,
    },
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist)
    throw new ApiError(404, "Playlist not found or missing permissions");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
