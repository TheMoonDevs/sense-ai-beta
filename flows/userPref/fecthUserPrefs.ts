import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zFeedModel } from "../../types/_data.feed";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { HomeFeedModel } from "../../models/_db.feed";
import { zInterestSchema } from "../../types/_data.interest";
import { InterestModel } from "../../models/_db.interest";
import { UserInterestModel } from "../../models/_db.userInterest";
import { zUserPrefModel } from "../../types/_data.userPrefs";
import { UserPreferencesModel } from "../../models/_db.userPrefs";

// TODO: setup pagination later depending on home feed requirements
export const fetchUserPrefsFlow = defineFlow(
  {
    name: "fetchUserPrefsFlow",
    inputSchema: z.object({
      pref_type: z.string().optional(),
      user_id: z.string().optional(),
      search: z.string().optional(),
      actions: z.array(z.string()).optional(),
      weightage: z.number().optional(),
      quantity: z.number().optional(),
      limit: z.number().optional(),
      skip: z.number().optional(),
      select: z.string().optional(),
      sort: z
        .enum(["weightage", "quantity", "updatedAt", "createdAt"])
        .optional(),
    }),
    outputSchema: z.object({
      prefs: z.array(zUserPrefModel.nullable().optional()),
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
    const prefs = await run("Fetch Mongodb Homefeed", async () => {
      return (await UserPreferencesModel.find(
        input.search
          ? {
              user_id: input.user_id,
              subject: { $regex: input.search, $options: "i" },
            }
          : input.actions && input.actions?.length > 0
          ? {
              user_id: input.user_id,
              actions: { $in: input.actions },
              quantity: { $ne: 0 },
            }
          : {
              user_id: input.user_id,
              ...(input.pref_type ? { type: input.pref_type } : {}),
              ...(input.quantity
                ? { quantity: { $eq: input.quantity } }
                : { quantity: { $ne: 0 } }),
            },
        null,
        {
          limit: input.limit ?? 10,
          skip: input.skip ?? 0,
          sort: input.sort ? { [input.sort]: -1 } : { updatedAt: -1 },
        }
      )
        .select(input.select ?? "-__v")
        .lean()
        .exec()) as (typeof zUserPrefModel._type)[];
    });
    return {
      prefs: prefs,
    };
  }
);
