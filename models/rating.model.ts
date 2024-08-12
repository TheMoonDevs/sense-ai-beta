import { model, Schema } from "mongoose";

const RatingSchema = new Schema(
  {
    doc_id: {
      type: Schema.Types.ObjectId,
    },
    ratedby_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rating_value: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default model("Rating", RatingSchema);
