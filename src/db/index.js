import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    logger.info(
      `MongoDB Conected! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    logger.error(`MongoDB Connection error : ${error}`);
    process.exit(1);
  }
};

export default connectDB;
