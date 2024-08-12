import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zFeedModel } from "../../types/_data.feed";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { HomeFeedModel } from "../../models/_db.feed";

// TODO: setup pagination later depending on home feed requirements
export const homeFeedFetchFlow = defineFlow(
  {
    name: "homeFeedFetchFlow",
    inputSchema: z.object({
      user_id: z.string().optional(),
    }),
    outputSchema: z.object({
      feed: z.array(zFeedModel.nullable().optional()),
    }),
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      console.log("auth", auth);
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
    const fetchedPrompt = await run("Fetch Mongodb Homefeed", async () => {
      return await HomeFeedModel.find(
        {
          user_id: input.user_id,
        },
        null,
        {
          limit: 10,
        }
      ).populate("linked_survey_id");
    });
    return {
      feed: fetchedPrompt,
    };
  }
);
