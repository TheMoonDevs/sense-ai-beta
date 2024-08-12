import {
  zSQSteerInputSchema,
  zSQSteerOutputSchema,
} from "../../types/_zod.survey";
import { defineSchema } from "@genkit-ai/core";

export const SQSteerInputSchema = defineSchema(
  "SQSteerInputSchema",
  zSQSteerInputSchema
);

export const SQSteerOutputSchema = defineSchema(
  "SQSteerOutputSchema",
  zSQSteerOutputSchema
);
