import mongoose, { model } from "mongoose";

const UserInterestSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    status: { type: String },
    interactivityIndex: { type: Number, default: 0 },
    total_time_spent: { type: Number, default: 0 },
    generated: { type: Number, default: 0, index: true },
    submitted: { type: Number, default: 0, index: true },
    topics: [
      {
        id: { type: String },
        depthLevel: { type: Number, default: 1 },
        broadnessOfTopic: { type: Number, default: 1 },
        total_time_spent: { type: Number, default: 0 },
        generated: { type: Number, default: 0 },
        submitted: { type: Number, default: 0 },
        subtopics: [
          {
            id: { type: String },
            total_time_spent: { type: Number, default: 0 },
            generated: { type: Number, default: 0 },
            submitted: { type: Number, default: 0 },
            lastGenerated: { type: Date, default: Date.now },
            lastSubmitted: { type: Date, default: Date.now },
          },
        ],
        lastGenerated: { type: Date, default: Date.now },
        lastSubmitted: { type: Date, default: Date.now },
      },
    ],
    lastGenerated: { type: Date, default: Date.now },
    lastSubmitted: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const UserInterestModel =
  mongoose.models.UserInterest || model("UserInterest", UserInterestSchema);
