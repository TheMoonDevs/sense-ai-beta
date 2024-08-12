import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zFeedModel } from "../../types/_data.feed";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { HomeFeedModel } from "../../models/_db.feed";
import {
  InterestSchemaType,
  zInterestCuration,
  zInterestSchema,
} from "../../types/_data.interest";
import { InterestModel } from "../../models/_db.interest";
import { generate } from "@genkit-ai/ai";
import { geminiPro } from "@genkit-ai/googleai";
import keyDefaultLists from "./keylists.json";

export const fetchListofInterestListsFlow = defineFlow(
  {
    name: "fetchListofInterestListsFlow",
    inputSchema: z.object({
      keywords: z.array(z.string()).optional(),
      count: z.number().default(10).optional(),
      limit: z.number().optional(),
      default: z.boolean().optional(),
    }),
    outputSchema: z.object({
      lists: z.array(zInterestCuration).optional(),
    }),
  },
  async (input) => {
    let curationListItems = keyDefaultLists
      .filter((_, i) => Math.floor(Math.random() * 10) > 5)
      .map((item) => {
        return {
          ...item,
          sort: "popularity",
          order: "desc",
          searchTerms: item.searchTerms.split(",").map((s) => s.trim()),
        } as z.infer<typeof zInterestCuration>;
      });
    if (!input.default) {
      const curationLists = await generate({
        model: geminiPro,
        prompt: ` Create ${input.count ?? 10} curations, pick subjects from ${
          input.keywords
            ? "areas of study like " + input.keywords.join(", ")
            : "different areas of study."
        }
      
      Curations are special collection of stuff to learn at the domain level. 
      ${
        /*Explore World cultural heritage, 
    Trending Technological Advances today. */ ""
      }
      and each curation will have its related subtopics assoicated with searchTerms.`,
        output: {
          format: "json",
          schema: z.object({
            curations: z.array(
              zInterestCuration.omit({
                data: true,
                icon: true,
                isGeneratable: true,
              })
            ),
          }),
        },
      });

      curationListItems = curationLists.output()?.curations ?? [];
    }

    if (!curationListItems || curationListItems.length === 0) {
      throw new Error("No curation list items found");
    }
    const operations = curationListItems.map(
      async (curationListItem: z.infer<typeof zInterestCuration>) => {
        const interests = await run("Fetch Mongodb Intests", async () => {
          return await InterestModel.find(
            {
              $or: curationListItem.searchTerms.map((term) => ({
                title: { $regex: term, $options: "i" },
              })),
            },
            {},
            {
              sort: {
                ...(curationListItem.sort === "other"
                  ? {
                      popularity: -1,
                    }
                  : {
                      [curationListItem.sort]:
                        curationListItem.order === "desc" ? -1 : 1,
                    }),
              },
              limit: input.limit ?? 10,
            }
          )
            .select("-breakdown -learningTopics -images")
            .lean()
            .exec();
        });

        return {
          ...curationListItem,
          id:
            curationListItem.id ??
            curationListItem.title.toLowerCase()?.replace(/\s/g, "-"),
          data: interests as InterestSchemaType[],
          isGeneratable: true,
        };
      }
    );

    const data = await run("saving all interests to db", async () => {
      return await Promise.all(operations);
    });

    return {
      lists: data,
    };
  }
);
