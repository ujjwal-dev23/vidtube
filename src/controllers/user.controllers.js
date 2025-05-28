import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import User from "../models/user.models.js";
import { cloudinaryUpload, cloudinaryDelete } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../constants.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("Error while generating Access and Refresh Tokens :", error);
    throw new ApiError(400, "Error while generating Access and Refresh Tokens");
  }
};

const userRegister = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (username !== username.toLowerCase()) {
    throw new ApiError(410, "Username should be lowercase");
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser)
    throw new ApiError(412, "Username/Email is already registered");

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) throw new ApiError(409, "Avatar Required");
  const coverLocalPath = req.files?.coverImage?.[0]?.path || "";

  let avatar = "";
  try {
    avatar = await cloudinaryUpload(avatarLocalPath);
  } catch (error) {
    logger.error("Avatar Upload Error :", error);
    throw new ApiError(500, "Failed to upload avatar");
  }

  let coverImage = "";
  try {
    coverImage = await cloudinaryUpload(coverLocalPath);
  } catch (error) {
    logger.error("Cover Image Upload Error :", error);
    throw new ApiError(500, "Failed to upload Cover Image");
  }

  try {
    const user = await User.create({
      username,
      email,
      fullName,
      avatar: avatar.url,
      coverImage: coverImage.url || "",
      password,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser)
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered Successfully"));
  } catch (error) {
    logger.error("User creation failed :", error);
    if (avatar) await cloudinaryDelete(avatar.public_id);
    if (coverImage) await cloudinaryDelete(coverImage.public_id);
    throw new ApiError(500, "Something went wrong while registering the user");
  }
});

const userLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (username !== username.toLowerCase())
    throw new ApiError(400, "username must be lowercase");

  const user = await User.findOne({ username });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) throw new ApiError(401, "Invalid Credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser)
    throw new ApiError(400, "Something went wrong while logging in");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: "",
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(200, {}, "Logged out successfully"));
  } catch (error) {
    logger.error("Logout Error :", error);
    throw new ApiError(500, "Something went wrong while logging out");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Refresh Token Required");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user || incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Invalid Refresh Token");

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Tokens refreshed successfully"
        )
      );
  } catch (error) {
    logger.error("Error while refreshing tokens :", error);
    throw new ApiError(500, "Something went wrong while refreshing tokens");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Details"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) throw new ApiError(400, "All fields required");

  // Full Name or Email Validation here
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Fields updated succesfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar Required");

  let avatar = "";
  try {
    avatar = await cloudinaryUpload(avatarLocalPath);
  } catch (error) {
    logger.error("Avatar Upload Error :", error);
    throw new ApiError(500, "Failed to upload avatar");
  }

  const user = User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {});

const updateUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(401, "Incorrect Old Password");

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated succesfully"));
});

export {
  userRegister,
  userLogin,
  refreshAccessToken,
  userLogout,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  updateUserPassword,
};
