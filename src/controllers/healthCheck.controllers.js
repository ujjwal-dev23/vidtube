import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

const healthCheck = asyncHandler(async (req, res, next) =>
  res.status(200).json(new ApiResponse(200, "OK", "Health Check Passed"))
);

export default healthCheck;
