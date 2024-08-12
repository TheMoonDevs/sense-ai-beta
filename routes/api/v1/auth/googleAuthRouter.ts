import express from "express";
import passport from "passport";
import { IUserDocument } from "../../../../types/user";
import SessionModel from "../../../../models/session.model";
import { verifyJwt } from "../../../../utils/jwt.utils";

const googleAuthRouter = express.Router();

// Step 1: Initiate Google OAuth flow
googleAuthRouter.get("/google", async (req, res, next) => {
  const sessionToken = req.query.sessionToken as string;
  const redirectUrl = req.query.redirectUrl as string;
  if (sessionToken) {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: JSON.stringify({
        sessionToken: sessionToken,
        redirectUrl: redirectUrl,
      }),
    })(req, res, next);
  } else {
    res.status(400).send("Missing state parameter");
  }
});

// Step 2: Handle the callback from Google OAuth
googleAuthRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    const { sessionToken, redirectUrl } = JSON.parse(req.query.state as string);
    const { decoded, expired } = verifyJwt(sessionToken);

    if (!decoded || expired) {
      res.status(400).send("Invalid session token");
    }

    const { sessionId } = decoded as { sessionId: string };

    if (!sessionId) {
      res.status(400).send("Invalid session token");
    }
    // if the user is not authenticated, delete the session
    if (!req.user) {
      await SessionModel.findByIdAndDelete(sessionId);
      res.status(401).send("User not authenticated");
    }
    try {
      const session = await SessionModel.findById(sessionId);
      if (session) {
        // check if the user is already in session
        if (session?.user) {
          if (redirectUrl) res.redirect(redirectUrl);
          res.send("Login successful, You can go back to the app now");
        } else {
          // save the user data to the session
          const user = req.user as IUserDocument;
          session.user = user._id;
          session.valid = true;
          session.userAgent = req.headers["user-agent"] as string;
          session.save();
          if (redirectUrl) res.redirect(redirectUrl);
          res.send("Login successful, You can go back to the app now");
        }
      } else {
        res
          .status(400)
          .send("Login failed, Please Go back to App to try again");
      }
    } catch (err) {
      console.error("Error processing callback:", err);
      res.status(500).send("Login failed, Please Go back to App to try again");
    }
  }
);

export default googleAuthRouter;
