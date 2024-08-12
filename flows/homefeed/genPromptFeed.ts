import { defineFlow, run } from "@genkit-ai/flow";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { z } from "zod";
import { InterestModel } from "../../models/_db.interest";
import {
  InterestSchemaType,
  zInterestSchema,
} from "../../types/_data.interest";
import { generate } from "@genkit-ai/ai";
import { gemini15Pro } from "@genkit-ai/googleai";

export const genPromptFeedFlow = defineFlow(
  {
    name: "genPromptFeedFlow",
    inputSchema: z.object({
      user_prompt: z.string().optional(),
      user_id: z.string().optional(),
      count: z.number().optional(),
    }),
    outputSchema: z.object({
      options: z.array(
        z.object({
          title: z.string().optional(),
          interest: zInterestSchema.optional(),
        })
      ),
      response: z.string().optional(),
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
    if (!input.user_prompt) {
      throw new Error("User prompt is required");
    }
    if (!input.user_id) {
      throw new Error("User Id is required");
    }

    const dbInterests: any[] = [];
    // await run("Fetch Interests", async () => {
    //     return await InterestModel.find({
    //         $or: [
    //             { title: { $regex: input.user_prompt, $options: "i" } },
    //             { "context.keywords": { $in: [input.user_prompt] } },
    //             //{ rootType: "curatedInterest" },
    //             //{ subtitle: { $regex: input.user_prompt, $options: "i" } },
    //         ]
    //     }).limit(5).lean().exec();
    // });

    let options: any[] = [];
    if (dbInterests && dbInterests?.length > 0) {
      options = options?.concat(
        dbInterests.map((interest) => ({
          title: interest.title as string,
          interest:
            "toJSON" in interest
              ? (interest.toJSON() as any)
              : (interest as any),
        }))
      );
      // return {
      //     options: dbInterests.map((interest) => ({
      //         title: interest.title as string,
      //         interest: "toJSON" in interest ? (interest.toJSON() as any) : interest as any,
      //     })),
      //     response: "Is what you are looking for in any of theese?"
      // }
    }

    const result = await generate({
      model: gemini15Pro,
      prompt: `User has asked for "${input.user_prompt}". Generate ${
        input.count ?? 4
      } possible topics that user might be interested in. Also include the user prompt in the generated topics if it is valid.
      all topic title are really short (max 4 words). also attach a short response message (max 25 words).`,
      output: {
        format: "json",
        schema: z.object({
          responseMessage: z.string().optional(),
          subjects: z.array(
            z.object({
              title: z.string().optional(),
              //interest: zInterestSchema.optional(),
            })
          ),
        }),
      },
    });
    const output = result.output();

    let genSubjects = output?.subjects;

    if (input.user_prompt.split(" ").length < 3) {
      const isGenerated =
        genSubjects?.find((subject) => subject.title === input.user_prompt) !=
        undefined;
      if (!isGenerated && genSubjects && genSubjects?.length > 0) {
        genSubjects = ([{ title: input.user_prompt }] as any[]).concat(
          genSubjects
        );
      }
    }

    const interestFinds = await run("Fetch Interests", async () => {
      return await InterestModel.find({
        title: { $in: genSubjects?.map((subject) => subject.title) },
      })
        .limit(input.count ?? 4)
        .lean()
        .exec();
    });

    if (genSubjects && genSubjects.length > 0) {
      options = options?.concat(
        genSubjects.map((subject) => {
          const matchingInterest = interestFinds.find(
            (interest) => interest.title === subject.title
          );
          return {
            title: subject.title as string,
            interest: matchingInterest
              ? "toJSON" in matchingInterest
                ? (matchingInterest.toJSON() as any)
                : (matchingInterest as any)
              : undefined,
          };
        })
      );
    }

    return {
      options,
      response: output?.responseMessage,
    };
  }
);
