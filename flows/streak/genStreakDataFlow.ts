import { generate } from "@genkit-ai/ai";
import { defineFlow } from "@genkit-ai/flow";
import { z } from "zod";
import { geminiPro } from "@genkit-ai/googleai";

export const genStreakDataFlow = defineFlow(
  {
    name: "genStreakDataFlow",
    inputSchema: z.object({
      streakNum: z.number(),
    }),
    outputSchema: z.object({
      streakEmoji: z.string(),
      streakTitle: z.string(),
      streakSubtitle: z.string(),
    }),
  },

  async (input) => {
    const generatedStreakData = await generate({
      model: geminiPro,
      prompt: `
      The Streak is not the daily streak here.
      It is calculated if the user answers the question correctly.
      The streak number is ${input.streakNum}. 
      Generate the following data:
      - streakEmoji: a relevant emoji representing the streak 
      - streakTitle: a relevant exciting title for the streak to boost user's confidence
      - streakSubtitle: a relevant exciting subtitle for the streak to boost user's confidence
      `,
      output: {
        format: "json",
        schema: z.object({
          streakEmoji: z.string(),
          streakTitle: z.string(),
          streakSubtitle: z.string(),
        }),
      },
    });
    const result = generatedStreakData.output() || {
      streakEmoji: "",
      streakTitle: "",
      streakSubtitle: "",
    };
    return {
      ...result,
    };
  }
);
