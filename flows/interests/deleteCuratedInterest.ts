import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { InterestModel } from "../../models/_db.interest";
import { exec } from "child_process";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { update } from "lodash";

export const deleteCuratedInterestFlow = defineFlow(
  {
    name: "deleteCuratedInterestFlow",
    inputSchema: z.object({
      _id: z.string().optional(),
      user_id: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean().optional(),
    }),
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
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
    if (!input._id) {
      throw new Error("Incorrect Update Data");
    }

    const saveTODB = await run("Save Curated Interest", async () => {
      return await InterestModel.findOneAndDelete({
        _id: input._id,
      }).exec();
    });

    return {
      success: saveTODB ? true : false,
    };
  }
);
