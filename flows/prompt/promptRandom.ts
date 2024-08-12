import { generate } from "@genkit-ai/ai";
import { defineFlow } from "@genkit-ai/flow";
import { z } from "zod";
import { PromptBreakdownHelper } from "./_gen.prompt";
import { PromptRandomOutputSchema } from "./_def.prompt";


export const promptRandomFlow = defineFlow(
    {
        name: "promptRandomFlow",
        inputSchema: z.object({
           keywords: z.array(z.string()).optional(),
        }),
        outputSchema: PromptRandomOutputSchema,
    },
    async (input) => {
        const randomPrompts = await PromptBreakdownHelper.generateRandomPrompt({
            keywords: input.keywords?.join(","),
        });
        return randomPrompts || {
            prompts: [],
        };
    }
);
