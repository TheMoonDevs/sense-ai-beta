import { generate } from "@genkit-ai/ai";
import { defineFlow } from "@genkit-ai/flow";
import { z } from "zod";
import { geminiPro } from "@genkit-ai/googleai";


export const genKeywordsFlow = defineFlow(
    {
        name: "genKeywordsFlow",
        inputSchema: z.object({
            prompt: z.string().optional(),
           keywords: z.array(z.string()).optional(),
           count: z.number().default(10).optional(),
        }),
        outputSchema: z.object({
            keywords: z.array(z.string()).optional(),
        }),
    },
    async (input) => {
        const generatedKeywords = await generate({
            model: geminiPro,
            prompt: input.prompt ?? `Generate ${input.count ?? 10} keywords similar to ${input.keywords?.join(", ")}`,
            output: {
                format: "json",
                schema: z.object({
                    keywords: z.array(z.string()).optional(),
                }),
            }
        })
        const response = generatedKeywords.output();
        let keywords = response?.keywords ?? [];

        if(input.keywords && input.keywords.length > 0) {
            keywords = keywords.filter((keyword) => !input.keywords?.includes(keyword));
        }
        return {
            keywords,
        };
    }
);