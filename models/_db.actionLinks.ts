import mongoose, { model } from "mongoose";

const ActionLinkSchema = new mongoose.Schema(
  {
    user_interest_id: { type: String },
    image_url: { type: String },
    title: { type: String },
    description: { type: String },
    ext_link: { type: String },
  },
  { timestamps: true }
);

export const ActionLinkModel =
  mongoose.models.ActionLink || model("ActionLink", ActionLinkSchema);
