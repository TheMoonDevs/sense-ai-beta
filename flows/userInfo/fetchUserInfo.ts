import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { UserInfoModel } from "../../models/_db.userInfo";
import { zUserInfoModel } from "../../types/_data.userInfo";

export const FetchUserInfoFlow = defineFlow(
  {
    name: "FetchUserInfoFlow",
    inputSchema: z.object({
      user_id: z.string(),
    }),
    outputSchema: zUserInfoModel.nullable(),
  },
  async (input) => {
    if (input) {
      const fetchedUserInfo = await run(
        "Fetch UserInfo from Mongodb",
        async () => {
          return await UserInfoModel.findOne({ user_id: input.user_id });
        }
      );
      return fetchedUserInfo;
    }
    return null;
  }
);
