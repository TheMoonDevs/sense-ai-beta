import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { InterestModel } from "../../models/_db.interest";
import { InterestSchemaType } from "../../types/_data.interest";
import { SerpApiSdk } from "../../service/serpApiSdk";
import { generate } from "@genkit-ai/ai";
import { geminiPro } from "@genkit-ai/googleai";
import { zActionModel, zActionModelType } from "../../types/_data.actionLink";
import { ActionLinkModel } from "../../models/_db.actionLinks";
import { UserInterestModel } from "../../models/_db.userInterest";
import { RandomHelper } from "../../utils/random";
import deserializeSenseUser from "../../middleware/deserializeUser";

export const genActionLinkFlow = defineFlow(
  {
    name: "genActionLinkFlow",
    inputSchema: z.object({
      user_id: z.string().optional(),
    }),

    outputSchema: zActionModel.optional(),

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
    if (!input?.user_id) {
      throw new Error("User Id is required");
    }
    const user_id = input.user_id;

    // ✅ 1. fetch curated user interests by popularity

    const fetchedUserInterests = await run(
      "Fetch Popular User Interests",
      async () => {
        const interests = await UserInterestModel.find(
          {
            user_id: user_id,
            topics: { $exists: true, $ne: [] },
          },
          null,
          {
            limit: 10,
          }
        )
          .lean()
          .exec();

        const learningTopics = interests.flatMap((i) => i.topics);
        const subTopics = learningTopics.flatMap((l) => l?.subtopics);
        const subtopicIds = subTopics.map((s) => s.id);
        return {
          subtopicIds,
        };
      }
    );

    //✅ 2. serpapi to search using user interests

    const googleSearchResults = await run("Google Search", async () => {
      const randomSubtopic = RandomHelper.pickOneAtRandom(
        fetchedUserInterests.subtopicIds
      );
      const searchResults = await SerpApiSdk.searchTextQuery(randomSubtopic, {
        page: 1,
      });
      return searchResults;
    });

    // ✅ 3. ai as juge to filter out most relevant serpapi result

    const aiResult = await generate({
      model: geminiPro.name,
      prompt: `
        Filter out most relevant results from the serpapi results and
        provide the most relevant result for the user.
        Serpapi results are ${JSON.stringify(googleSearchResults)}. 
        title: required field with title of picked result.
        description: description of picked result.
        ext_link field: required field. pick the most relevant link from ${
          googleSearchResults.textQueryResult.inline_videos
        } or ${googleSearchResults.textQueryResult.organic_results}.
        image_url: required field. pick the most relevant image link from ${
          googleSearchResults.textQueryResult.inline_images
        }. Do not pick favicon image.
        In case you cant find any of the fields then you must generate it according to your choice. 
              `,
      output: {
        format: "json",
        schema: zActionModel.pick({
          title: true,
          description: true,
          ext_link: true,
          image_url: true,
        }),
      },
    });

    aiResult.output();

    // const aiResults = await run(
    //   "AI Result",
    //   async () => await Promise.all(aiResultPromises)
    // );

    // ✅ 4. create action slide based on the ai result

    const actionLinkSlide = await run("Create Action Slide", async () => {
      const actionSlide = await ActionLinkModel.create({
        ...aiResult.output(),
      });
      console.log("actionSlide", actionSlide);

      return actionSlide;
    });

    console.log("actionLinkSlide", actionLinkSlide);

    return actionLinkSlide;
  }
);
