import mongoose, { model, Schema } from "mongoose";

const SurveySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    surveyTypeId: {
      type: String,
    },
    promptId: {
      type: Schema.Types.ObjectId,
    },
    linked_type: {
      type: String,
    },
    linked_id: {
      type: String,
    },
    linked_order: {
      type: Number,
    },
    question: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    keywords: {
      type: [String],
    },
    options: {
      type: [Schema.Types.Mixed],
    },
    is_open_ended: {
      type: Boolean,
    },
    ui: {
      type: Schema.Types.Mixed,
    },
    logic: {
      type: Schema.Types.Mixed,
    },
    response: {
      type: Schema.Types.Mixed,
    },
    extra: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const SurveyModel =
  mongoose.models.Survey || mongoose.model("Survey", SurveySchema);
