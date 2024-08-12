import { z } from "zod";
import { zStopperSchema } from "./_zod.stopper";
import {
  zPromptBreakdownAlertsOutputSchema,
  zPromptBreakdownClassificationOutputSchema,
  zPromptDepthOutputSchema,
  zPromptFinetuningSchema,
  zPromptKnowledgeSchema,
} from "./_zod.prompt";
import { zId } from "./_zod.common";

export const zPromptModel = z.object({
  _id: zId,
  input_prompt: z.string(),
  user_id: zId.nullable().optional(),
  alerts: zPromptBreakdownAlertsOutputSchema.optional(),
  stopper: zStopperSchema.optional(),
  firstBreakdown: zPromptBreakdownClassificationOutputSchema.optional(),
  firstDepth: zPromptDepthOutputSchema.optional(),
  promptKnowledge: zPromptKnowledgeSchema.optional(),
  finetuning: zPromptFinetuningSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type zPromptModelType = z.infer<typeof zPromptModel>;
