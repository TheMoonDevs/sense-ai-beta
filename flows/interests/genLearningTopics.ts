import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { InterestModel } from "../../models/_db.interest";
import { generate } from "@genkit-ai/ai";
import { geminiPro } from "@genkit-ai/googleai";
import {
  InterestSchemaType,
  zLearningTopicSchema,
} from "../../types/_data.interest";

export const genInterestLearningTopicsFlow = defineFlow(
  {
    name: "genInterestLearningTopicsFlow",
    inputSchema: z.object({
      interest_id: z.string().optional(),
      for_topic: z.string().optional(),
    }),
    outputSchema: z.object({
      learningTopics: z.array(zLearningTopicSchema).optional(),
      subTopics: z.array(z.string()).optional(),
      subTopicObjects: zLearningTopicSchema.shape.subTopicObjects.optional(),
    }),
  },
  async (input) => {
    if (!input.interest_id) {
      throw new Error("Interest Id is required");
    }

    const interestData = await run("Fetch Interest Data", async () => {
      return (await InterestModel.findOne({
        interest_id: input.interest_id,
      }).exec()) as InterestSchemaType;
    });

    if (!interestData) {
      throw new Error("Interest not found");
    }

    let forWhat = `user wishes to learn about ${interestData.title} - ${interestData.subtitle}. `;

    if (input.for_topic) {
      forWhat = `user wishes to learn about ${input.for_topic} under ${interestData.title}. some context ${interestData.subtitle}. `;

      const thisLearningTopics = interestData.learningTopics?.find(
        (topic) => topic.title === input.for_topic
      );

      forWhat = `user wishes to learn about ${thisLearningTopics?.title} under ${interestData.title}. some context ${thisLearningTopics?.description}. `;

      const learningTopicsSubTopics = thisLearningTopics?.subTopicObjects?.map(
        (st) => st.text
      );

      const doesNotInclude =
        learningTopicsSubTopics && learningTopicsSubTopics.length > 0
          ? `Do not include topics are already generated: ${learningTopicsSubTopics
              ?.join(",")
              .trim()}`
          : "";
      const genSubTopicsResponse = await generate({
        model: geminiPro,
        prompt: ` ${forWhat}
              Divide the subject into sequential small learning topics. and generate
              a varied set of short topics. Each generated topic should be able to generate multiple subtopics.
              ${doesNotInclude}`,
        output: {
          format: "json",
          schema: z.object({
            topics: zLearningTopicSchema.shape.subTopicObjects,
          }),
        },
      });

      let genSubTopics =
        genSubTopicsResponse.output()?.topics?.map((n) => n.text) ?? [];

      genSubTopics = genSubTopics.filter((st) => {
        return learningTopicsSubTopics?.includes(st ?? "") ? false : true;
      });

      return {
        subTopics: genSubTopics,
        subTopicObjects: genSubTopicsResponse.output()?.topics ?? [],
      };
    }

    let doesNotInclude = "";

    if (interestData.learningTopics && interestData.learningTopics.length > 0) {
      doesNotInclude = `Do not include topics are already generated: ${interestData.learningTopics
        .map((topic) => topic.title)
        .join(",")
        .trim()}`;
    }

    const genResponse = await generate({
      model: geminiPro,
      prompt: ` ${forWhat}
            Divide the subject into sequential small learning topics. and generate the following fields for each learning topic.
            title - title of the learning area under subject
            description - information about the topic.
            depthLevel - depth level of the learning area under subject (from 0 to 10)
            broadnessOfTopic - broadness of this topic area (from 0 to 10)
            subTopicObjects - a varied set of short topics. each subTopicObject should have text that will help to generate multiple subtopics.
            ${doesNotInclude}`,
      output: {
        format: "json",
        schema: z.object({
          learningTopics: z
            .array(
              zLearningTopicSchema.omit({
                subLearningTopics: true,
                subTopics: true,
              })
            )
            .optional(),
        }),
      },
    });

    let learningTopics = genResponse.output()?.learningTopics ?? [];

    if (interestData.learningTopics && interestData.learningTopics.length > 0) {
      learningTopics = learningTopics.filter((topic) => {
        return interestData.learningTopics?.findIndex(
          (existingTopic) => existingTopic.title === topic.title
        ) === -1
          ? true
          : false;
      });
      learningTopics = learningTopics.filter((topic) => {
        return topic.subTopicObjects && topic.subTopicObjects?.length > 0
          ? true
          : false;
      });
    }

    if (learningTopics.length > 0) {
      const saveTODB = await run("Save Learning Topics", async () => {
        return await InterestModel.findOneAndUpdate(
          {
            interest_id: input.interest_id,
          },
          {
            learningTopics: [
              ...(interestData.learningTopics ?? []),
              ...learningTopics,
            ],
          }
        ).exec();
      });
    }

    return {
      learningTopics,
    };
  }
);
