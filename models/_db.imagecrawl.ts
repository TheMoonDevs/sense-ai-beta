import mongoose, { Schema, model } from "mongoose";

const ImageCrawlSchema = new mongoose.Schema(
  {
    image_id: { type: String },
    query: { type: String },
    source: { type: String },
    imageType: { type: String },
    orientation: { type: String },
    description: { type: String },
    color: { type: String },
    image: { type: String },
    urls: { type: Array || Schema.Types.Mixed },
    eta_timestamp: { type: Number },
    crawlStatus: { type: String },
    fetch_result: { type: String },
  },
  {
    timestamps: true,
  }
);

export const ImageCrawlModel = model("ImageCrawl", ImageCrawlSchema);
