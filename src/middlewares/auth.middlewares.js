import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import User from "../models/user.models.js";
import jwt from "jsonwebtoken";

const auth = asyncHandler(async (req, _, next) => {
  const incomingAccessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!incomingAccessToken) throw new ApiError(401, "Unauthorized");

  try {
    const decodedToken = jwt.verify(
      incomingAccessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Unauthorized");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid Access Token");
  }
});

export default auth;
