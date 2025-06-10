import { Subscription } from "../models/subscription.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(400, "Channel Id required");

  const deletedSub = await Subscription.findOneAndDelete({
    channel: channelId,
    subscriber: req.user?._id,
  });

  let responseObject = {};
  let message = "";

  if (deletedSub) {
    message = "Unsubscribed sucessfully";
  } else {
    responseObject = await Subscription.create({
      channel: channelId,
      subscriber: req.user?._id,
    });
    message = "Subscribed successfully";
  }

  return res.status(200).json(new ApiResponse(200, responseObject, message));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(400, "Channel Id is required");

  const subbedList = await Subscription.find({
    channel: req.user?._id,
  }).populate("subscriber", "username avatar");

  if (!subbedList.length) throw new ApiError(404, "No subscribers found");

  return res
    .status(200)
    .json(new ApiResponse(200, subbedList, "Subscribers fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) throw new ApiError(400, "Subscriber Id is required");

  const subbedChannels = await Subscription.find({
    subscriber: req.user?._id,
  }).populate("channel", "username avatar");

  if (!subbedChannels.length) throw new ApiError(404, "No subscriptions found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, subbedChannels, "Subscriptions fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
