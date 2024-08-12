import { get } from "lodash";
import { config } from "../config/env.conf";
import { FilterQuery, UpdateQuery } from "mongoose";
import SessionModel from "../models/session.model";
import { verifyJwt, signJwt } from "../utils/jwt.utils";
import { findUser } from "./user.service";
import { IUserSession } from "../types/user";

export async function createSession(userId: string, userAgent: string) {
  const session = await SessionModel.create({ user: userId, userAgent });

  return session.toJSON();
}

export async function findSessions(query: FilterQuery<IUserSession>) {
  return SessionModel.find(query).lean();
}

export async function updateSession(
  query: FilterQuery<IUserSession>,
  update: UpdateQuery<IUserSession>
) {
  return SessionModel.updateOne(query, update);
}

export async function reIssueAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  const { decoded } = verifyJwt(refreshToken);

  if (!decoded || !get(decoded, "session")) return false;

  const session = await SessionModel.findById(get(decoded, "session"));

  if (!session || !session.valid) return false;

  const user = await findUser({ _id: session.user });

  if (!user) return false;

  const accessToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.accessTokenTtl } // 15 minutes
  );

  return accessToken;
}
