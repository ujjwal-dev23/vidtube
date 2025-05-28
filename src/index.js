import { app } from "./app.js";
import logger from "./utils/logger.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({ path: "src/.env" });

const PORT = process.env.PORT;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server is running at port : ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error(`MongoDB Connection error : ${error}`);
  });
