import { ZodEffects, ZodString, ZodType, ZodUnion, z } from "zod";

export const zId = z.string().or(z.any());
