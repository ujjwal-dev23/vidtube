import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import logger from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config({ path: "src/.env" });

cloudinary.config({
  secure: true,
  cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: String(process.env.CLOUDINARY_API_KEY),
  api_secret: String(process.env.CLOUDINARY_API_SECRET),
});

const cloudinaryUpload = async (localFilePath) => {
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    logger.info(`File uploaded on Cloudinary : ${response.url}`);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    logger.error("Error during Cloudinary Upload :", error);
    return null;
  }
};

const cloudinaryDelete = async (publicId, resource_type = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type,
      invalidate: true,
    });
    logger.info(`Public Id - ${publicId} deleted from Cloudinary`);
    return result;
  } catch (error) {
    logger.error("Error while deleting from Cloudinary :", error);
    return null;
  }
};

export { cloudinaryUpload, cloudinaryDelete };
