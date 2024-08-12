import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import { StopperHelper } from "../stoppers/StopperHelper";
import { PromptModel } from "../../models/_db.prompt";
import { zPromptModel } from "../../types/_data.prompt";
import { defaultFineTuning } from "../../types/_zod.prompt";
import { PromptBreakdownHelper } from "./_gen.prompt";
import deserializeSenseUser from "../../middleware/deserializeUser";
import mongoose from "mongoose";
import { PromptBreakdownInputSchema } from "./_def.prompt";

// FLOWS

// input_prompt -> the prompt that needs to be broken down.
// prompt_id? -> only pass when you want to retrigger & update old prompt with new genai breakdown.
// related_prompt_id? -> to create new prompt and breakdown while keeping the related.
export const promptBreakdownFlow = defineFlow(
  {
    name: "promptBreakdownFlow",
    inputSchema: PromptBreakdownInputSchema.extend({
      user_id: z.string().optional(),
    }),
    outputSchema: z.object({
      promptOutput: zPromptModel.optional(),
      error: z.string().optional(),
      //promptSteer: SQSteerOutputSchema.optional().nullable(),
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
    // Alerts -> verify if the prompt is valid and stop it if its not.
    const user_id = input.user_id;
    if(!user_id) {
      throw new Error("Authorization required.");
    }
    // fetch the input_prompt if prompt_id is passed.
    if (input.prompt_id) {
      const fetchedPrompt = await run("Fetch Mongodb Prompt", async () => {
        return await PromptModel.findById(input.prompt_id);
      });
      if (!input.input_prompt && fetchedPrompt) {
        input.input_prompt = fetchedPrompt?.input_prompt;
      }
    }

    // identify if needs to be stopped
    const _alerts = await PromptBreakdownHelper.generateAlerts(input);
    const stopper_alerts = StopperHelper.promptBreakdownStopper(_alerts ?? {});

    // stop the prompt if its not valid.
    if (
      stopper_alerts &&
      stopper_alerts.stopper.code === 500 &&
      !input.prompt_id
    ) {
      const createdPrompt = await run(
        "Triggered Stopper -> create Errored Mongodb Prompt",
        async () => {
          return await PromptModel.create({
            user_id: user_id,
            alerts: _alerts,
            input_prompt: input.input_prompt,
            stopper: stopper_alerts.stopper,
            related_prompt_id: input.related_prompt_id ?? undefined,
          });
        }
      );
      return { promptOutput: createdPrompt, promptSteer: null };
    }

    // identify and breakdown the prompt.
    const _breakdown = await PromptBreakdownHelper.generateClassification(
      input
    );
    if (!_breakdown) {
      return { error: "Prompt Classification Failed" };
    }

    const keywordsObj = await PromptBreakdownHelper.generateKeywords({
      classification: _breakdown,
    });

    // create the prompt model in mogodb.
    let createdPrompt = await run(
      "Update Mongodb Prompt -> Classification",
      async () => {
        return await PromptModel.create({
          alerts: _alerts,
          user_id: user_id,
          firstBreakdown: _breakdown,
          promptKnowledge: keywordsObj,
          input_prompt: input.input_prompt,
          stopper: stopper_alerts?.stopper,
          related_prompt_id: input.related_prompt_id ?? undefined,
          finetuning: defaultFineTuning(),
        });
      }
    );

    const _depth = await PromptBreakdownHelper.generateDepth({
      input_prompt: input.input_prompt,
      classification: _breakdown,
    });

    createdPrompt =
      (await run("Update Mongodb Prompt -> Depth", async () => {
        return await PromptModel.findByIdAndUpdate(
          createdPrompt._id,
          { firstDepth: _depth },
          { new: true }
        );
      })) ?? createdPrompt;

    let promptSteer;
    console.log("createdPrompt", createdPrompt);

    // if (stopper_alerts && stopper_alerts.stopper.code === 501) {
    //   promptSteer = await SurveyHelper.generateSteerSurvey({
    //     promptData: {...createdPrompt, createdAt: new Date(createdPrompt.createdAt), updatedAt: new Date(createdPrompt.updatedAt),},
    //     steerPrompt: `The reason is - ${
    //       stopper_alerts.stopper.reason
    //     }.The possible actions are - ${stopper_alerts.stopper.steer?.join(
    //       ","
    //     )}.Pick one and create a survey question to steer the users intent into learning something particular.` as string,
    //   });
    // }

    return {
      promptOutput: createdPrompt.toJSON(),
      //promptSteer: promptSteer ?? null,
    };
  }
);
