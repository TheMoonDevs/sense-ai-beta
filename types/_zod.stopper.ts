import { z } from "zod";

export const zStopperSchema = z.object({
  reason: z.string(),
  message: z.string(),
  code: z.number().optional(),
  steer: z.array(z.string()).optional(),
  action: z.array(z.union([z.literal("survey"), z.literal("skip")])).optional(),
});

export type StopperType = z.infer<typeof zStopperSchema>;
