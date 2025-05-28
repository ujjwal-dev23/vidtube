import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const schema = new Schema(
  {
    videoFile: {
      type: String, // URL
      required: true,
    },
    thumbnail: {
      type: String, // URL
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

schema.plugin(mongooseAggregatePaginate);

export const Video = new mongoose.model("Video", schema);
