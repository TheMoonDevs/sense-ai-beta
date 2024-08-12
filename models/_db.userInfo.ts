import mongoose, { model } from "mongoose";

const UserInfoSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userAcademics: { type: mongoose.Schema.Types.Mixed },
    userProfession: { type: mongoose.Schema.Types.Mixed },
    userTaste: { type: mongoose.Schema.Types.Mixed },
    userBackground: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const UserInfoModel =
  mongoose.models.UserInfo || model("user_info", UserInfoSchema);
