import mongoose from "mongoose";
import { IUserSession } from "../types/user";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    valid: { type: Boolean, default: true },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

const SessionModel = mongoose.models.Session || mongoose.model<IUserSession>("Session", sessionSchema);

export default SessionModel;
