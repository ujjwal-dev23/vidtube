import { Tweet } from "../models/tweet.models.js";
import User from "../models/user.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) throw new ApiError(400, "Content is required");
  if (content.length > 500)
    throw new ApiError(401, "Maximum length of string is 500");

  try {
    const tweet = await Tweet.create({ content, owner: req.user?._id });
    const createdTweet = await Tweet.findById(tweet._id);
    if (!createdTweet)
      throw new ApiError(500, "Something went wrong while creating the tweet");
    return res
      .status(200)
      .json(new ApiResponse(200, createdTweet, "Tweet Created Successfully"));
  } catch (error) {
    logger.error("Tweet Creation Failed :", error);
    throw new ApiError(500, "Something went wrong while creating the tweet");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) throw new ApiError(400, "Username is required");

  const user = await User.findOne({ username: username });
  if (!user) throw new ApiError(404, "User not found");

  const tweets = await Tweet.find({ owner: user._id });
  if (!tweets.length) throw new ApiError(404, "Tweets not found");

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { _id: tweetId, content: newContent } = req.body;
  if (!tweetId || !newContent)
    throw new ApiError(400, "Id and Content are required");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found");
  if (!tweet.owner.equals(req.user?._id))
    throw new ApiError(401, "You can only edit your own tweets");

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: newContent,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated succesfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { id: tweetId } = req.params;
  if (!tweetId) throw new ApiError(400, "Tweet ID required");

  const tweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(
      404,
      "Tweet not found or you don't have permission to delete it"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedTweetId: tweetId },
        "Tweet deleted successfully"
      )
    );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
