// import { defineFlow, run } from "@genkit-ai/flow";
// import deserializeSenseUser from "../../middleware/deserializeUser";
// import { UserInterestModel } from "../../models/_db.userInterest";
// import {
//   AddUserInterestsInputSchema,
//   AddUserInterestsOutputSchema,
// } from "../../types/_zod.userInterest";
// import { reasonWeightage } from "./_config";

// export const SaveUserInterestsFlow = defineFlow(
//   {
//     name: "SaveUserInterestsFlow",
//     inputSchema: AddUserInterestsInputSchema,
//     outputSchema: AddUserInterestsOutputSchema,
//     middleware: [deserializeSenseUser],
//     authPolicy: (auth, input) => {
//       console.log("auth", auth);
//       if (!auth || !auth._id) {
//         throw new Error("Authorization required.");
//       }
//       input.user_id = auth._id.toString();
//     },
//   },
//   async (input) => {
//     try {
//       const { keywords, reason, user_id } = input;

//       const weightageIncrement = reasonWeightage.find(
//         (r) => r.reason === reason
//       )?.weightage;

//       const operations = keywords.map((keyword) =>
//         UserInterestModel.findOne({
//           user_id,
//           keyword: { $regex: new RegExp("^" + keyword + "$", "i") }, // Case-insensitive match
//         })
//           .exec()
//           .then((existingKeyword) => {
//             if (existingKeyword) {
//               // If keyword exists, update it
//               return UserInterestModel.updateOne(
//                 { _id: existingKeyword._id },
//                 {
//                   $set: { reason, updatedAt: new Date() },
//                   $inc: { weightage: weightageIncrement },
//                 }
//               ).exec();
//             } else {
//               // If keyword does not exist, insert a new one
//               return new UserInterestModel({
//                 user_id,
//                 keyword,
//                 reason,
//                 weightage: weightageIncrement,
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//               }).save();
//             }
//           })
//       );

//       // Execute all operations in parallel
//       await run("saving all keywords to db", async () => {
//         return await Promise.all(operations);
//       });
//       return {
//         status: "success",
//         message: "UserInterest keywords saved successfully",
//       };
//     } catch (error) {
//       console.error("Failed to save user interests:", error);
//       throw new Error("Error saving user interests.");
//     }
//   }
// );
