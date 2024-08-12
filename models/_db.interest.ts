import mongoose, { Schema, model } from "mongoose";

const InterestSchema = new mongoose.Schema(
  {
    interest_id: { type: String, unique: true, index: true, required: true },
    parent_interest: { type: String, index: true },
    title: { type: String },
    subtitle: { type: String },
    image: { type: String },
    images: { type: Schema.Types.Mixed, default: [] },
    interestType: { type: String, required: true, index: true },
    rootType: { type: String, required: true, index: true },
    domain: { type: String, index: true },
    context: { type: Schema.Types.Mixed },
    breakdown: { type: Schema.Types.Mixed },
    isCurated: { type: Boolean, default: false },
    isEditorsPick: { type: Boolean, default: false },
    popularity: { type: Number, default: 0, index: true },
    learningTopics: { type: Schema.Types.Mixed },
    social_stats: {
      followers: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      ratedBy: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const InterestModel =
  mongoose.models.InterestSchema || model("interest", InterestSchema);
