import { z } from "zod";
import { zId } from "./_zod.common";
import { zInterestRootEnum } from "./_data.interest";

export const AddUserInterestsInputSchema = z.object({
  user_id: zId,
  keywords: z.array(z.string()).min(1),
  reason: zInterestRootEnum.optional(),
});

export const AddUserInterestsOutputSchema = z.object({
  status: z.string().min(1),
  message: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
});
