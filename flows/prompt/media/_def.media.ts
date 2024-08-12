import {
  zPromptAudioInputSchema,
  zPromptAudioOutputSchema,
  zPromptImageInputSchema,
  zPromptImageOutputSchema,
} from "../../../types/_zod.media";
import { defineSchema } from "@genkit-ai/core";

export const PromptAudioInputSchema = defineSchema(
  "PromptAudioInputSchema",
  zPromptAudioInputSchema
);

export const PromptAudioOutputSchema = defineSchema(
  "PromptAudioOutputSchema",
  zPromptAudioOutputSchema
);

export const PromptImageInputSchema = defineSchema(
  "PromptImageInputSchema",
  zPromptImageInputSchema
);

export const PromptImageOutputSchema = defineSchema(
  "PromptImageOutputSchema",
  zPromptImageOutputSchema
);
