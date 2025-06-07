import express from "express";
import logger from "./utils/logger.js";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Route Imports
import healthCheckRoute from "./routes/healthCheck.routes.js";
import userRoute from "./routes/user.routes.js";
import tweetRoute from "./routes/tweet.routes.js";

// Route setup
app.use("/api/v1/health", healthCheckRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/tweets", tweetRoute);

export { app };
