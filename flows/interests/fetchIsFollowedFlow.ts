import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zId } from "../../types/_zod.common";
import followModel from "../../models/follow.model";
import deserializeSenseUser from "../../middleware/deserializeUser";

export const fetchIsFollowedFlow = defineFlow(
  {
    name: "fetchIsFollowedFlow",
    inputSchema: z.object({
      interest_ids: z.array(zId.optional()),
      user_id: zId.optional(),
    }),
    outputSchema: z.array(
      z.object({
        interest_id: zId,
        isFollowed: z.boolean(),
      })
    ),
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      if (!auth || !auth._id) {
        throw new Error("Authorization required.");
      }
      input.user_id = auth._id.toString();
    },
  },
  async (input) => {
    const response = input?.interest_ids.map(async (id) => {
      const isFollowed = await followModel.findOne({
        doc_type: "interest",
        to_id: id,
        from_id: input.user_id,
      });
      return {
        interest_id: id,
        isFollowed: isFollowed ? true : false,
      };
    });

    const result = await Promise.all(response);
    return result;
  }
);
