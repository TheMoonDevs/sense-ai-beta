import { Router } from "express";
import requireUser from "../../../middleware/requireUser";
import {
  followCheckHandler,
  followHandler,
  unfollowHandler,
} from "../../../controller/social/follow.controller";
import {
  getRatingHandler,
  ratingHandler,
  removeRatingHandler,
} from "../../../controller/social/rating.controller";

const socialRouter = Router();

socialRouter.post("/follow/check", requireUser, followCheckHandler);
socialRouter.post("/follow", requireUser, followHandler);
socialRouter.delete("/unfollow", requireUser, unfollowHandler);
socialRouter.post("/rating", requireUser, ratingHandler);
socialRouter.delete("/rating", requireUser, removeRatingHandler);
socialRouter.post("/get-rating", requireUser, getRatingHandler);

export default socialRouter;
