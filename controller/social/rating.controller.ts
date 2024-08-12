import { Request, Response } from "express";
import ratingModel from "../../models/rating.model";
import userModel from "../../models/user.model";
import { InterestModel } from "../../models/_db.interest";
import mongoose from "mongoose";

// Model selection based on doc_type
const models: { [key: string]: any } = {
  interest: InterestModel,
};

export async function getRatingHandler(req: Request, res: Response) {
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

    const docData = await model.findById(doc_id);
    if (!docData) {
      return res.status(404).send({
        message: "Document not found",
        success: false,
      });
    }

    const userRating = await ratingModel.findOne({
      doc_id: doc_id,
      ratedby_id: user._id,
    });

    const { rating, ratedBy } = docData.social_stats;
    return res.status(200).send({
      message: "Rating fetched",
      success: true,
      data: {
        userRating: userRating ? userRating.rating_value : null,
        avgRating: rating,
        ratedBy,
      },
    });
  } catch (e: any) {
    console.log(e);
    return res.status(409).send({ message: e.message, success: false });
  }
}
export async function ratingHandler(req: Request, res: Response) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = res.locals.user;
    const { doc_id, doc_type, rating_value: new_rating_value } = req.body;

    if (!doc_id || !doc_type || new_rating_value === undefined) {
      console.log("doc_id, doc_type, and rating_value are required");
      return res
        .status(400)
        .send("doc_id, doc_type, and rating_value are required");
    }

    const model = models[doc_type];
    if (!model) {
      console.log("Invalid doc_type");
      return res.status(400).send("Invalid doc_type");
    }

    const existingRatingData = await ratingModel.findOne({
      doc_id: doc_id,
      ratedby_id: user._id,
    });

    let interest;
    let responseMessage = "";
    let responseData = {};

    if (existingRatingData) {
      if (existingRatingData.rating_value === new_rating_value) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).send({
          message: "Rating value is the same",
          success: false,
        });
      } else {
        const old_rating_value = existingRatingData.rating_value || 0;
        existingRatingData.rating_value = new_rating_value;
        await existingRatingData.save({ session });

        // Update social_stats in Interest model
        interest = await model.findById(doc_id);
        const new_total_rating =
          interest.social_stats.rating * interest.social_stats.ratedBy -
          old_rating_value +
          new_rating_value;
        const new_avg_rating = new_total_rating / interest.social_stats.ratedBy;

        await model.findByIdAndUpdate(
          doc_id,
          {
            $set: { "social_stats.rating": new_avg_rating },
          },
          { session }
        );

        responseMessage = "Updated Rating";
        responseData = {
          userRating: existingRatingData.rating_value,
          avgRating: new_avg_rating,
          ratedBy: interest.social_stats.ratedBy,
        };
      }
    } else {
      const rating = new ratingModel({
        doc_id: doc_id,
        ratedby_id: user._id,
        rating_value: new_rating_value,
      });
      await rating.save({ session });

      // Update social_stats in Interest model
      interest = await model.findById(doc_id);
      const new_total_rating =
        interest.social_stats.rating * interest.social_stats.ratedBy +
        new_rating_value;
      const new_avg_rating =
        new_total_rating / (interest.social_stats.ratedBy + 1);

      await model.findByIdAndUpdate(
        doc_id,
        {
          $set: { "social_stats.rating": new_avg_rating },
          $inc: { "social_stats.ratedBy": 1 },
        },
        { session }
      );

      // Ensure the social_stats.rating array contains an element with the correct doc_type
      await userModel.updateOne(
        { _id: user._id, "social_stats.rating.doc_type": { $ne: doc_type } },
        {
          $push: { "social_stats.rating": { doc_type, rating_count: 0 } },
        },
        { session }
      );

      // Update social_stats in User model
      await userModel.updateOne(
        { _id: user._id, "social_stats.rating.doc_type": doc_type },
        { $inc: { "social_stats.rating.$.rating_count": 1 } },
        { session }
      );

      responseMessage = "Added Rating";
      responseData = {
        userRating: rating.rating_value,
        avgRating: new_avg_rating,
        ratedBy: interest.social_stats.ratedBy + 1,
      };
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).send({
      message: responseMessage,
      success: true,
      data: responseData,
    });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    console.log(e);
    return res.status(500).send({ message: e.message, success: false });
  }
}

export async function removeRatingHandler(req: Request, res: Response) {
  const session = await mongoose.startSession();
  session.startTransaction();
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

    const existingRatingData = await ratingModel.findOne({
      doc_id: doc_id,
      ratedby_id: user._id,
    });

    if (!existingRatingData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({
        message: "rating not found",
        success: false,
      });
    }

    const old_rating_value = existingRatingData.rating_value || 0;
    await existingRatingData.deleteOne({ session });

    // Update social_stats in Interest model
    const interest = await model.findById(doc_id);
    const new_total_rating =
      interest.social_stats.rating * interest.social_stats.ratedBy -
      old_rating_value;
    const new_avg_rating =
      interest.social_stats.ratedBy > 1
        ? new_total_rating / (interest.social_stats.ratedBy - 1)
        : 0;

    await model.findByIdAndUpdate(
      doc_id,
      {
        $set: { "social_stats.rating": new_avg_rating },
        $inc: { "social_stats.ratedBy": -1 },
      },
      { session }
    );

    // Ensure the social_stats.rating array contains an element with the correct doc_type
    await userModel.updateOne(
      { _id: user._id, "social_stats.rating.doc_type": { $ne: doc_type } },
      {
        $push: { "social_stats.rating": { doc_type, rating_count: 0 } },
      },
      { session }
    );

    // Update social_stats in User model
    await userModel.updateOne(
      { _id: user._id, "social_stats.rating.doc_type": doc_type },
      { $inc: { "social_stats.rating.$.rating_count": -1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).send({
      message: "Removed Rating",
      success: true,
      data: {
        userRating: null,
        avgRating: new_avg_rating,
        ratedBy: interest.social_stats.ratedBy - 1,
      }
    });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    console.log(e);
    return res.status(500).send({ message: e.message, success: false });
  }
}
