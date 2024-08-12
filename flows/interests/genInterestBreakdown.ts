import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zInterestSchema } from "../../types/_data.interest";
import { InterestModel } from "../../models/_db.interest";
import { generate } from "@genkit-ai/ai";
import { geminiPro } from "@genkit-ai/googleai";
import deserializeSenseUser from "../../middleware/deserializeUser";

export const genInterestBreakdownFlow = defineFlow(
  {
    name: "genInterestBreakdownFlow",
    inputSchema: z.object({
      interest_id: z.string().optional(),
      user_id: z.string().optional(),
    }),
    outputSchema: z.object({ interest: zInterestSchema.optional() }),
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      if (!auth || !auth._id) {
        throw new Error("Authorization required.");
      }
      input.user_id = auth._id.toString();
    },
  },
  async (input) => {
    const interest = await run("Fetch Mongodb Homefeed", async () => {
      return await InterestModel.findOne({
        interest_id: input.interest_id,
      });
    });

    if (!interest) {
      throw new Error("Interest not found");
    }

    if (interest.breakdown) {
      return {
        interest: interest?.toJSON(),
      };
    }

    // GENERATE CALSSIFICATION
    const contextData = await generate({
      model: geminiPro,
      prompt: `Generate context for ${interest.title} 
            - domain: The top-level field of the subject.
            - field: Which particular field it belongs to within the domain. 
            - specifity: The level of broadness of the subject.
            `,
      output: {
        format: "json",
        schema: z.object({
          breakdown: zInterestSchema.shape.breakdown,
        }),
      },
    });
    interest.breakdown = contextData.output()?.breakdown ?? null;
    if (!interest.domain) {
      interest.domain = interest.breakdown?.domain;
    }

    //GENERATE KEYWORDS

    //GENERATE LEARNIGN TOPICS

    //SAVE TO DB
    await run("Save Curated Interest", async () => {
      return await interest.save();
    });

    return {
      interest: interest?.toJSON(),
    };
  }
);
