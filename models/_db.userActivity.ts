import mongoose, { model } from "mongoose";

const UserActivitySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, required: true, index: true },
    action: {
      type: String,
      index: true,
    },
    screen: {
      type: String,
      index: true,
    },
    quantity: { type: Number, index: true },
    weightage: { type: Number, required: true, default: 1 },
    linked_interest_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "interest",
      index: true,
    },
    linked_prompt_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "prompt",
      index: true,
    },
    linked_survey_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "survey",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserActivityModel =
  mongoose.models.UserActivity || model("user_activity", UserActivitySchema);
