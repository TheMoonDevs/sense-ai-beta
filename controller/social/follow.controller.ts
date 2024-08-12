import { Request, Response } from "express";
import followModel from "../../models/follow.model";
import userModel from "../../models/user.model";
import { InterestModel } from "../../models/_db.interest";
import { UserInterestModel } from "../../models/_db.userInterest";
import { UserInterestTrackerModel } from "../../models/_db.userInterestTracker";

// selecting model from doc_id
export const models: { [key: string]: any } = {
  interest: InterestModel,
};

export async function followCheckHandler(req: Request, res: Response) {
  try {
    const user = res.locals.user;
    const { doc_id, doc_type } = req.body;
    if (!doc_id || !doc_type) {
      console.log("doc_id and doc_type are required");
      return res.status(400).send("doc_id and doc_type are required");
    }

    const model = models[doc_type];
    if (!model) {
      console.log("Invalid doc_type");
      return res.status(400).send("Invalid doc_type");
    }

    const existingFollow = await followModel.findOne({
      to_id: doc_id,
      from_id: user._id,
    });

    const docData = await model.findById(doc_id);
    const followers = docData?.social_stats.followers;

    if (existingFollow) {
      return res.status(200).send({
        message: "User follows the document",
        success: true,
        data: {
          isFollowing: true,
          followers,
        },
      });
    } else {
      return res.status(200).send({
        message: "User does not follow the document",
        success: true,
        data: {
          isFollowing: false,
          followers,
        },
      });
    }
  } catch (e: any) {
    console.log(e);
    return res.status(409).send({ message: e.message, success: false });
  }
}

export async function followHandler(req: Request, res: Response) {
  try {
    const user = res.locals.user;
    const { doc_id, doc_type } = req.body;
    if (!doc_id || !doc_type) {
      console.log("doc_id and doc_type are required");
      return res.status(400).send("doc_id and doc_type are required");
    }

    const model = models[doc_type];
    if (!model) {
      console.log("Invalid doc_type");
      return res.status(400).send("Invalid doc_type");
    }

    const existingFollow = await followModel.findOne({
      to_id: doc_id,
      from_id: user._id,
    });

    if (existingFollow) {
      console.log("Already following");
      return res.status(400).send({
        message: "Already following",
        success: false,
      });
    }

    const session = await followModel.startSession();
    session.startTransaction();

    try {
      const follow = new followModel({
        doc_type,
        to_id: doc_id,
        from_id: user._id,
      });
      await follow.save({ session });

      // Ensure the social_stats.following array contains an element with the correct doc_type
      await userModel.updateOne(
        { _id: user._id, "social_stats.following.doc_type": { $ne: doc_type } },
        {
          $push: { "social_stats.following": { doc_type, following_count: 0 } },
        },
        { session }
      );

      // Update social_stats in User and model
      // Increment the following_count for the specified doc_type
      await userModel.updateOne(
        { _id: user._id, "social_stats.following.doc_type": doc_type },
        { $inc: { "social_stats.following.$.following_count": 1 } },
        { session }
      );

      const docData = await model.findByIdAndUpdate(
        doc_id,
        { $inc: { "social_stats.followers": 1 } },
        { session, new: true }
      );

      if (doc_type === "interest") {
        const userInterestData = {
          user_id: user._id,
          interest_id: doc_id,
          status: "active",
          topics: docData?.learningTopics?.map((topic: any) => ({
            id: topic?.title,
            depthLevel: topic?.depthLevel,
            broadnessOfTopic: topic?.broadnessOfTopic,
            subtopics: topic?.subTopics?.map((subTopic: any) => ({
              id: subTopic,
            })),
          })),
        };

        await UserInterestModel.updateOne(
          { user_id: user._id, interest_id: doc_id },
          { $set: userInterestData },
          { upsert: true, session }
        );

        console.log("User interest updated or created successfully");
      }

      if (!docData) {
        throw new Error("Document not found");
      }

      await session.commitTransaction();
      session.endSession();

      const followers = docData.social_stats.followers;
      console.log("followed", followers);

      return res.status(200).send({
        message: "followed",
        success: true,
        data: { followers },
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction error:", error);
      return res.status(500).send({ message: error.message, success: false });
    }
  } catch (e: any) {
    console.log(e);
    return res.status(500).send({ message: e.message, success: false });
  }
}

export async function unfollowHandler(req: Request, res: Response) {
  try {
    const user = res.locals.user;
    const { doc_id, doc_type } = req.body;
    if (!doc_id || !doc_type) {
      console.log("doc_id and doc_type are required");
      return res.status(400).send("doc_id and doc_type are required");
    }

    const model = models[doc_type];
    if (!model) {
      console.log("Invalid doc_type");
      return res.status(400).send("Invalid doc_type");
    }

    const existingFollow = await followModel.findOne({
      to_id: doc_id,
      from_id: user._id,
    });

    if (!existingFollow) {
      console.log("follow relationship not found");
      return res.status(404).send({
        message: "follow relationship not found",
        success: false,
      });
    }

    const session = await followModel.startSession();
    session.startTransaction();

    try {
      await existingFollow.deleteOne({ session });

      // Ensure the social_stats.following array contains an element with the correct doc_type
      await userModel.updateOne(
        { _id: user._id, "social_stats.following.doc_type": { $ne: doc_type } },
        {
          $push: { "social_stats.following": { doc_type, following_count: 0 } },
        },
        { session }
      );

      // Update social_stats in User and model
      // Decrement the following_count for the specified doc_type
      await userModel.updateOne(
        { _id: user._id, "social_stats.following.doc_type": doc_type },
        { $inc: { "social_stats.following.$.following_count": -1 } },
        { session }
      );

      const docData = await model.findByIdAndUpdate(
        doc_id,
        {
          $inc: { "social_stats.followers": -1 },
        },
        { session, new: true }
      );

      if (!docData) {
        throw new Error("Document not found");
      }

      if (doc_type === "interest") {
        let existingUserInterest = await UserInterestModel.findOne({
          user_id: user._id,
          interest_id: doc_id,
        }).exec();

        // if (!existingUserInterest) {
        //   throw new Error("UserInterest not found");
        // }

        if (existingUserInterest) {
          existingUserInterest.status = "inactive";
          await existingUserInterest.save({ session });

          await UserInterestTrackerModel.updateMany(
            {
              user_id: user._id,
              interest_id: doc_id,
            },
            {
              $set: {
                status: "inactive",
              },
            },
            { session }
          );
        }
      }
      await session.commitTransaction();
      session.endSession();

      const followers = docData.social_stats.followers;
      console.log("unfollowed", followers);

      return res.status(200).send({
        message: "unfollowed",
        success: true,
        data: {
          followers,
        },
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction error:", error);
      return res.status(500).send({ message: error.message, success: false });
    }
  } catch (e: any) {
    console.log(e);
    return res.status(500).send({ message: e.message, success: false });
  }
}
