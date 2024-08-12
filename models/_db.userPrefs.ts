import mongoose, { model } from "mongoose";

const UserPreferencesSchema = new mongoose.Schema(
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
    subject: {
      type: String,
    },
    domain: {
      type: String,
      index: true,
    },
    subdomain: {
      type: String,
    },
    weightage: { type: Number, required: true, default: 0 },
    quantity: { type: Number, index: true },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const UserPreferencesModel =
  mongoose.models.UserPreferences || model("user_prefs", UserPreferencesSchema);
