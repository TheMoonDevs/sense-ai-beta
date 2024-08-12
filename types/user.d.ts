import mongoose from "mongoose";

export interface IUserProfile {
  email: string;
  name: string;
  password?: string;
  profile_url?: string;
  googleId?: string;
  phone?: string;
  accesssData?: {
    admin: boolean;
    betaAccess: boolean;
    betaAccessRequested: boolean;
  };
  social_stats?: {
    following: {
      doc_type: string;
      following_count: number;
    }[];
    rating: {
      doc_type: string;
      rating_count: number;
    }[];
  };
}

export interface IUserDocument extends IUserProfile, mongoose.Document {
  _id: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<Boolean>;
}

export interface IUserSession extends mongoose.Document {
  user: IUserDocument["_id"];
  valid: boolean;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}
