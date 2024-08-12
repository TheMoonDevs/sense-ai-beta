import { Socket } from "socket.io";
import { verifyJwt } from "../utils/jwt.utils";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import { reIssueAccessToken } from "../service/session.service";
import { IUserDocument } from "../types/user";

/**
 * Middleware to authenticate a websocket
 */
export async function socketAuth({
  context,
  socket,
}: {
  context: unknown;
  socket: Socket;
}): Promise<IUserDocument | undefined> {
  const sessionToken = socket.request.headers["x-session-token"]?.toString();

  if (sessionToken) {
    const { decoded } = verifyJwt(sessionToken);

    if (!decoded) {
      return;
    }

    const { sessionId } = decoded as { sessionId: string };

    if (!sessionId) {
      return;
    }

    const session = await SessionModel.findById(sessionId);

    if (!session) {
      return;
    }

    const user = await UserModel.findById(session?.user);

    if (!user) {
      return;
    }
    return user;
  }
  const accessToken = socket.request.headers["authorization"]?.split(" ").at(1);
  const refreshToken = socket.request.headers["x-refresh"]?.toString();

  if (!accessToken) {
    return;
  }

  const { decoded, expired } = verifyJwt(accessToken);

  if (decoded) {
    return decoded as IUserDocument;
  }

  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      socket.request.headers["authorization"] = `Bearer ${newAccessToken}`;
    }

    const result = verifyJwt(newAccessToken as string);

    return result.decoded as IUserDocument;
  }

  return;
}
