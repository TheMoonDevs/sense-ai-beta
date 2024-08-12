import mongoose from "mongoose";

export interface IConfig {
  configId: string;
  configType: string;
  configApp?: string;
  configData?: any;
}

export interface IConfigDocument extends IConfig, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}
