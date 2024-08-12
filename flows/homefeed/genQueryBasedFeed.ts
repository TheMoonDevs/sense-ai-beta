import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { InterestSchemaType } from "../../types/_data.interest";
import { InterestModel } from "../../models/_db.interest";
import { genInterstQuizFlow2 } from "../survey/interest_survey/genInterestQuizFlow2";
import { FeedCOnverter } from "./convertor.helper";
import { zFeedModel } from "../../types/_data.feed";
import { UserPrefModelType, zUserPrefModel } from "../../types/_data.userPrefs";
import { UserPreferencesModel } from "../../models/_db.userPrefs";
import { RandomHelper } from "../../utils/random";
import { UserInterestModel } from "../../models/_db.userInterest";
import { genUserInterstQuizFlow2 } from "../userInterest/genUserInterstQuiz2";

export const genQueryBasedFeedFlow = defineFlow(
  {
    name: "genQueryBasedFeedFlow",
    inputSchema: z.object({
      user_id: z.string().optional(),
      query: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      editorsPick: z.boolean().optional(),
      interest_ids: z.array(z.string()).optional(),
      pref_ids: z.array(z.string()).optional(),
      count: z.number().default(10).optional(),
      variety: z.number().default(1).optional(),
      tasteContext: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean().optional(),
      response: z
        .object({
          surveys: z.any().optional(),
          used_interest_ids: z.array(z.string()).optional(),
          feeds: z.array(zFeedModel).optional(),
        })
        .optional(),
    }),
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

    // FIRST: FETCH INTERESTS BASED ON QUERY
    let contextInterests: InterestSchemaType[] = [];
    if (input.editorsPick) {
      contextInterests = await run("Fetch Curated Interests", async () => {
        return await InterestModel.find(
          {
            isCurated: true,
            isEditorsPick: true,
            rootType: "curatedInterest",
          },
          {},
          {
            limit: input.count,
            sort: { popularity: -1 },
          }
        )
          .select("-images -__v")
          .exec();
      });
    } else if (input.keywords && input.keywords.length > 0) {
      contextInterests = await run("Fetch Interests", async () => {
        return await InterestModel.find(
          {
            "context.keywords": { $in: input.keywords },
            rootType: "curatedInterest",
          },
          {},
          {
            limit: input.count,
            sort: { popularity: -1 },
          }
        )
          .select("-images -__v")
          .exec();
      });
    } else if (input.interest_ids && input.interest_ids.length > 0) {
      contextInterests = await run("Fetch Interests", async () => {
        return await InterestModel.find(
          {
            interest_id: { $in: input.interest_ids },
            rootType: "curatedInterest",
          },
          {},
          {
            limit: input.count,
            sort: { popularity: -1 },
          }
        )
          .select("-images -__v")
          .exec();
      });
    }

    let contextPrefs: UserPrefModelType[] = [];
    let allPrefs: UserPrefModelType[] = [];
    if (input.pref_ids && input.pref_ids.length > 0) {
      contextPrefs = await run("Fetch Prefs", async () => {
        return (await UserPreferencesModel.find({
          _id: { $in: input.pref_ids },
          user_id: input.user_id,
        })
          .select("-__v")
          .lean()
          .exec()) as UserPrefModelType[];
      });
    }
    allPrefs = await run("Fetch Prefs", async () => {
      return (await UserPreferencesModel.find({
        user_id: input.user_id,
        // TODO: fetch prefs based on contextInteressts
      })
        .select("-__v")
        .lean()
        .limit(20)
        .exec()) as UserPrefModelType[];
    });

    // if(contextPrefs.length > 0) {
    //     const filteredContexts = await run("Filter Prefs", async () => {
    //         return contextInterests.filter((thisInter) => {

    //             thisInter.context.keywords
    //         });
    //     }
    // }
    // fetch prefs for interest or
    // fetch interests for prefs.
    // if(input?.pref_ids?.length > 0 ) {
    //     const interestPrefs = await run("Fetch Prefs", async () => {

    //     })
    // }

    if (contextInterests.length === 0) {
      console.log("input is", input);
      throw new Error("No interests found based on query");
    }

    //SECOND: generate quiz based on context interests
    const surveys = await Promise.all(
      Array.from({ length: input.count ?? contextInterests.length ?? 10 }).map(
        async () => {
          try {
            const shortenedLength =
              contextInterests.length < 3
                ? contextInterests.length - 1
                : Math.floor(
                    (contextInterests.length - 1) * (input.variety ?? 0)
                  );
            const randomIndex = Math.floor(Math.random() * shortenedLength);
            let contextInterest = contextInterests[randomIndex];
            if (!contextInterest) contextInterest = contextInterests[0];
            let shouldAddSpecifiedTasteContex = undefined;
            if (
              contextInterest.breakdown &&
              contextInterest.breakdown?.specifity &&
              ["broad", "medium", "unkown", "ambiguous"].includes(
                contextInterest.breakdown?.specifity
              )
            ) {
              if (input.tasteContext)
                shouldAddSpecifiedTasteContex = input.tasteContext;
              else {
                const randomPicked =
                  contextPrefs.length > 0
                    ? RandomHelper.pickOneAtRandom(contextPrefs)
                    : RandomHelper.pickOneAtRandom(allPrefs);
                if (randomPicked) {
                  shouldAddSpecifiedTasteContex =
                    randomPicked.action + " " + randomPicked.subject;
                }
              }
            } else {
              // subject is very specific.
              // add taste carefully.
            }
            let interestQuiz;
            const userInterest = await run("Fetch User Interest", async () => {
              return await UserInterestModel.findOne({
                user_id: input.user_id,
                interest_id: contextInterest?._id,
              }).exec();
            });
            if (userInterest) {
              interestQuiz = await runFlow(
                genUserInterstQuizFlow2,
                {
                  interest_id: contextInterest._id,
                  user_interest: userInterest,
                  surveyConfig: {
                    linked_type: "interest",
                    linked_id: contextInterest._id,
                    surveyTypeId: "feed_interest_quiz",
                  },
                  user_id: input.user_id,
                  tasteContext: shouldAddSpecifiedTasteContex ?? undefined,
                },
                {
                  withLocalAuthContext: { _id: input.user_id },
                }
              );
            } else {
              interestQuiz = await runFlow(
                genInterstQuizFlow2,
                {
                  interest: contextInterest,
                  surveyConfig: {
                    linked_type: "interest",
                    linked_id: contextInterest._id,
                    surveyTypeId: "feed_interest_quiz",
                  },
                  user_id: input.user_id,
                  tasteContext: shouldAddSpecifiedTasteContex ?? undefined,
                },
                {
                  withLocalAuthContext: { _id: input.user_id },
                }
              );
            }
            if (interestQuiz) {
              return interestQuiz;
            } else {
              return undefined;
            }
          } catch (e) {
            console.log("Error generating quiz", e);
            return undefined;
          }
        }
      )
    );

    const feeds = await FeedCOnverter.convertQuizToFeed(surveys, input.user_id);

    // console.log(
    //   "feeds",
    //   feeds.map((feed) => feed?.linked_survey_id)
    // );
    return {
      success: true,
      response: {
        // surveys: surveys,
        interest_ids: contextInterests.map((interest) => interest.interest_id),
        feeds: feeds
          .filter((feed) => feed !== undefined)
          .map((feed) => ({
            ...feed,
            interest_id: contextInterests.find(
              (inter) => inter._id.toString() === feed?.interest_id?.toString()
            ),
          })),
      },
    };
  }
);
