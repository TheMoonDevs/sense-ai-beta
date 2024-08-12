import mongoose, { model, Schema } from "mongoose";

const UserInterestTrackerSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    interest_id: {
      type: Schema.Types.ObjectId,
      ref: "interest",
    },
    user_interest_id: {
      type: Schema.Types.ObjectId,
      ref: "UserInterest",
    },
    learning_topic_id: { type: String },
    topic_type: { type: String },
    topic_id: { type: String },
    total_points: { type: Number, default: 0 },
    status: { type: String },
    interactivityIndex: { type: Number, default: 0 },
    total_time_spent: { type: Number, default: 0 },
    generated: { type: Number, default: 0 },
    submitted: { type: Number, default: 0 },
    points_distribution: {
      type: [
        {
          type: { type: String },
          count: { type: Number, default: 0 },
          points: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    knowledgePoints: { type: [String], default: [] },
    lastGenerated: { type: Date, default: Date.now },
    lastSubmitted: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const UserInterestTrackerModel =
  mongoose.models.UserInterestTracker ||
  model("UserInterestTracker", UserInterestTrackerSchema);
