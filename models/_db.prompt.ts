import mongoose, { model } from "mongoose";

const PromptSchema = new mongoose.Schema(
  {
    input_prompt: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    alerts: { type: mongoose.Schema.Types.Mixed },
    stopper: { type: mongoose.Schema.Types.Mixed },
    firstBreakdown: { type: mongoose.Schema.Types.Mixed },
    firstDepth: { type: mongoose.Schema.Types.Mixed },
    promptKnowledge: { type: mongoose.Schema.Types.Mixed },
    finetuning: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const PromptModel = model("Prompt", PromptSchema);
// console.log("PromptSchema", PromptSchema.obj);
