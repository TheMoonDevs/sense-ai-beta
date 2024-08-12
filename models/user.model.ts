import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { IUserDocument } from "../types/user";
import { config } from "../config/env.conf";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, sparse: true },
    name: { type: String },
    password: { type: String },
    profile_url: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    accesssData: {
      admin: { type: Boolean, default: false },
      betaAccess: { type: Boolean, default: false },
      betaAccessRequested: { type: Boolean, default: false },
    },
    social_stats: {
      following: [
        {
          doc_type: { type: String },
          following_count: { type: Number, default: 0 },
        },
      ],
      rating: [
        {
          doc_type: { type: String },
          rating_count: { type: Number, default: 0 },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  let user = this as IUserDocument;

  if (!user.password || !user.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(config.saltWorkFactor);
  const hash = await bcrypt.hashSync(user.password ?? "", salt);

  user.password = hash;

  return next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const user = this as IUserDocument;
  return bcrypt
    .compare(candidatePassword, user.password ?? "")
    .catch((e) => false);
};

const UserModel =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);

export default UserModel;
