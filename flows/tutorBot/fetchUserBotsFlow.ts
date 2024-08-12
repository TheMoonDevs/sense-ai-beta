import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { zTutorBotSchema } from "../../types/_data.tutorBot";
import { TutorBotModel } from "../../models/_db.tutorBot";

export const fetchUserBotsFlow = defineFlow(
  {
    name: "fetchUserBotsFlow",
    inputSchema: z.object({
      user_id: z.string().optional(),
    }),
    outputSchema: z.array(zTutorBotSchema).optional().nullable(),
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
    const fetchedBot = await TutorBotModel.find({ user_id: input.user_id });

    return fetchedBot;
  }
);
