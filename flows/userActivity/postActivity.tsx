import { defineFlow } from "@genkit-ai/flow";
import { z } from "zod";


export const postUserActivityFlow = defineFlow({
    name: "postUserActivityFlow",
    inputSchema: z.object({
        user_id: z.string().optional(),
        data: z.any().optional(),
    }),
    outputSchema: z.object({
        success: z.boolean().optional(),
    }),
}, async (input) => {



    return {
        success: true,
    }
})