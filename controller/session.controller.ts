import { Request, Response } from "express";
import { config } from "../config/env.conf";
import {
  createSession,
  findSessions,
  updateSession,
} from "../service/session.service";
import { validatePassword } from "../service/user.service";
import { signJwt } from "../utils/jwt.utils";
import SessionModel from "../models/session.model";

export async function createUserSessionHandler(req: Request, res: Response) {
  // Validate the user's password
  const user = await validatePassword(req.body);

  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  // create a session
  const session = await createSession(
    user._id as string,
    req.get("user-agent") || ""
  );

  // create an access token
  const accessToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.accessTokenTtl } // 15 minutes,
  );

  // create a refresh token
  const refreshToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.refreshTokenTtl } // 1 week
  );

  // Set only the refresh token in an HttpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    domain: config.baseUrl,
    path: "/",
    // sameSite: "strict", // Adjust based on your cross-site request needs
    sameSite: "none", // Adjust based on your cross-site request needs
    // secure: true, // Set to true if your site is served over HTTPS
    secure: false, // Set to true if your site is served over HTTPS
  });

  // Send both tokens in the response body
  return res.send({ accessToken, refreshToken });
}

export async function getUserSessionsHandler(req: Request, res: Response) {
  const userId = res.locals.user._id;

  const sessions = await findSessions({ user: userId, valid: true });

  return res.send(sessions);
}

export async function deleteSessionHandler(req: Request, res: Response) {
  const sessionId = res.locals.user.session;

  await updateSession({ _id: sessionId }, { valid: false });

  return res.send({
    accessToken: null,
    refreshToken: null,
  });
}

export async function createEmptySession(req: Request, res: Response) {
  const newSession = await SessionModel.create({
    userAgent: req.get("user-agent") || "",
  });

  const session = newSession.toJSON();

  // create an session access token
  const emptySessionToken = signJwt(
    { sessionId: session._id },
    { expiresIn: "7d" } // 1 week,
  );

  return res.send({ emptySessionToken });
}
