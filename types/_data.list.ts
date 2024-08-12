import { z } from "zod";
import { zId } from "./_zod.common";
import { zInterestSchema } from "./_data.interest";

export const zListSchema = z.object({
  _id: zId,
  dataType: z.enum(["interest", "prompt"]).optional(),
  queryType: z.enum(["ref", "ids", "searchTerm"]).optional(),
  queryIds: z.array(z.string()).optional(),
  searchTerm: z.string().optional(),
  interestRefs: z.array(z.string()).optional(),
  interests: z.array(zInterestSchema).optional(),
  popularity: z.number().min(0).max(1).default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ListSchemaType = z.infer<typeof zInterestSchema>;
