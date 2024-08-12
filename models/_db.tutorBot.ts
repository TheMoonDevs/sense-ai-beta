import mongoose, { Schema, model } from "mongoose";

const TutorBotSchema = new mongoose.Schema(
  {
    fullname: { type: String },
    nickname: { type: String },
    subtitle: { type: String },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bio: { type: String },
    bot_prompt: { type: String },
    avatars: { type: Schema.Types.Mixed, default: [] },
    prompt_prefix: { type: String },
    isEditorsPick: { type: Boolean, default: false },
    popularity: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const TutorBotModel =
  mongoose.models.TutorBotSchema || model("TutorBot", TutorBotSchema);
