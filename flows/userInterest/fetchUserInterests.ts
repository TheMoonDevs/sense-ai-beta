import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zFeedModel } from "../../types/_data.feed";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { HomeFeedModel } from "../../models/_db.feed";
import { zInterestSchema } from "../../types/_data.interest";
import { InterestModel } from "../../models/_db.interest";
import { UserInterestModel } from "../../models/_db.userInterest";
import { zUserInterestSchema } from "../../types/_data.userInterest";

// TODO: setup pagination later depending on home feed requirements
export const fetchUserIterestsFlow = defineFlow(
  {
    name: "fetchUserIterestsFlow",
    inputSchema: z.object({
      for_user_id: z.string().optional(),
      user_id: z.string().optional(),
      limit: z.number().optional(),
      skip: z.number().optional(),
      interest_id: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      search: z.string().optional(),
      select: z.string().optional(),
      sort: z.enum(["popularity", "updatedAt", "createdAt"]).optional(),
    }),
    outputSchema: z.object({
      user_interests: z.array(zUserInterestSchema.nullable().optional()),
    }),
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      //console.log("auth", auth);
      if (!auth || !auth._id) {
        throw new Error("Authorization required.");
      }
      input.user_id = auth._id.toString();
    },
  },
  async (input) => {
    if (!input.user_id) {
      throw new Error("User Id is required");
    }
    console.log("input", input);
    const interests = await run("Fetch Mongodb Homefeed", async () => {
      return (await UserInterestModel.find(
        input.interest_id
          ? {
              interest_id: input.interest_id,
            }
          : input.for_user_id
          ? {
              user_id: input.for_user_id,
            }
          : {},
        null,
        {
          limit: input.limit ?? 10,
          skip: input.skip ?? 0,
          sort: input.sort ? { [input.sort]: -1 } : { updatedAt: -1 },
        }
      )
        .select(input.select ?? "-images -__v")
        .lean()
        .populate("interest_id")
        .exec()) as (typeof zUserInterestSchema._type)[];
    });
    return {
      user_interests: interests,
    };
  }
);
