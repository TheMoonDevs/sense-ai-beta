import mongoose from "mongoose";
import { IConfigDocument } from "../types/configData";

const configSchema = new mongoose.Schema(
  {
    configId: { type: String, required: true, unique: true },
    configType: { type: String, required: true },
    configApp: { type: String },
    configData: { type: Object },
  },
  {
    timestamps: true,
  }
);

const ConfigModel = mongoose.models.Config || mongoose.model<IConfigDocument>("ConfigModelSchema", configSchema);

export default ConfigModel;
