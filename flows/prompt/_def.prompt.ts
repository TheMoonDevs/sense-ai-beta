import {
  zPromptBreakdownAlertsOutputSchema,
  zPromptBreakdownClassificationOutputSchema,
  zPromptBreakdownInputSchema,
  zPromptDepthInputSchema,
  zPromptDepthOutputSchema,
  zPromptFinetuningSchema,
  zPromptKeywordsInputSchema,
  zPromptKeywordsOutputSchema,
  zPromptKnowledgeSchema,
  zPromptRandomInputSchema,
  zPromptRandomOutputSchema,
} from "../../types/_zod.prompt";
import { defineSchema } from "@genkit-ai/core";

export const PromptBreakdownInputSchema = defineSchema(
  "PromptBreakdownInputSchema",
  zPromptBreakdownInputSchema
);

export const PromptRandomInputSchema = defineSchema(
  "PromptRandomInputSchema",
  zPromptRandomInputSchema
);

export const PromptRandomOutputSchema = defineSchema(
  "PromptRandomOutputSchema",
  zPromptRandomOutputSchema
);

// Classification
export const PromptBreakdownClassificationOutputSchema = defineSchema(
  "PromptBreakdownClassificationOutputSchema",
  zPromptBreakdownClassificationOutputSchema
);

// Depth
export const PromptDepthInputSchema = defineSchema(
  "PromptDepthInputSchema",
  zPromptDepthInputSchema
);

export const PromptDepthOutputSchema = defineSchema(
  "PromptDepthOutputSchema",
  zPromptDepthOutputSchema
);

// Alerts & finetuning
export const PromptBreakdownAlertsOutputSchema = defineSchema(
  "PromptBreakdownAlertsOutputSchema",
  zPromptBreakdownAlertsOutputSchema
);

// big suprsets of type of finetuning questions - how deep do you wanna go.
export const PromptFinetuningSchema = defineSchema(
  "PromptFinetuningSchema",
  zPromptFinetuningSchema
);

export const PromptKnowledgeSchema = defineSchema(
  "PromptKnowledgeSchema",
  zPromptKnowledgeSchema
);

export const PromptKeywordsInputSchema = defineSchema(
  "PromptKeywordsInputSchema",
  zPromptKeywordsInputSchema
);

export const PromptKeywordsOutputSchema = defineSchema(
  "PromptKeywordsOutputSchema",
  zPromptKeywordsOutputSchema
);
