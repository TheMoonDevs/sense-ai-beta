import { zStopperSchema } from "../../types/_zod.stopper";
import { defineSchema } from "@genkit-ai/core";

export const StopperSchema = defineSchema("StopperSchema", zStopperSchema);
