import mongoose, { Schema, model } from "mongoose";
import { string } from "zod";

const HomeFeedSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    interest_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "interest",
    },
    rootType: {
      type: String,
    },
    linked_type: {
      type: String,
    },
    course_id: {
      type: String,
    },
    prompt_id: {
      type: String,
    },
    user_interest_id: {
      type: String,
    },
    priority: {
      type: Number,
    },
    interaction: {
      type: Number,
      default: 0,
    },
    maturityDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    feedType: {
      type: String,
    },
    linked_survey_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
      index: true,
    },
    linkedSurvey: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const HomeFeedModel =
  mongoose.models.HomeFeedSchema || model("homefeed", HomeFeedSchema);
