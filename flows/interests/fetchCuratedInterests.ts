import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zFeedModel } from "../../types/_data.feed";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { HomeFeedModel } from "../../models/_db.feed";
import { zInterestSchema } from "../../types/_data.interest";
import { InterestModel } from "../../models/_db.interest";

// TODO: setup pagination later depending on home feed requirements
export const fetchCuratedIterestsFlow = defineFlow(
  {
    name: "fetchCuratedIterestsFlow",
    inputSchema: zInterestSchema
      .pick({
        isCurated: true,
        isEditorsPick: true,
        interestType: true,
        rootType: true,
        parent_interest: true,
      })
      .extend({
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
      interests: z.array(zInterestSchema.nullable().optional()),
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
      return (await InterestModel.find(
        input.interest_id
          ? {
              interest_id: input.interest_id,
            }
          : input.search
          ? {
              title: { $regex: input.search, $options: "i" },
            }
          : input.parent_interest
          ? { parent_interest: input.parent_interest }
          : input.keywords && input.keywords?.length > 0
          ? {
              "context.keywords": { $in: input.keywords },
              interestType: input.interestType ?? "subject",
              rootType: input.rootType ?? "curatedInterest",
            }
          : {
              ...(input.isEditorsPick
                ? { isEditorsPick: input.isEditorsPick }
                : {}),
              isCurated: input.isCurated ?? true,
              interestType: input.interestType ?? "subject",
              rootType: input.rootType ?? "curatedInterest",
            },
        null,
        {
          limit: input.limit ?? 10,
          skip: input.skip ?? 0,
          sort: input.sort ? { [input.sort]: -1 } : { updatedAt: -1 },
        }
      )
        .select(input.select ?? "-images -__v")
        .lean()
        .exec()) as (typeof zInterestSchema._type)[];
    });
    return {
      interests: interests,
    };
  }
);
