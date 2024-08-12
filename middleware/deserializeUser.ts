import { get } from "lodash";
import { verifyJwt } from "../utils/jwt.utils";
import { reIssueAccessToken } from "../service/session.service";
import UserModel from "../models/user.model";
import SessionModel from "../models/session.model";

const deserializeSenseUser = async (req: any, res: any, next: any) => {
  const sessionToken = get(req, "headers.x-session-token") as string;

  if (sessionToken) {
    const { decoded } = verifyJwt(sessionToken);

    if (decoded) {
      const { sessionId } = decoded as { sessionId: string };

      if (sessionId) {
        const session = await SessionModel.findById(sessionId);

        if (session) {
          const user = await UserModel.findById(session?.user);

          if (user) {
            res.locals.user = user;
            req.auth = user;
            return next();
          }
        }
      }
    }
  }

  const accessToken = get(req, "headers.authorization", "").replace(
    /^Bearer\s/,
    ""
  );

  const refreshToken =
    get(req, "cookies.refreshToken") || get(req, "headers.x-refresh");

  if (!accessToken) {
    return next();
  }

  const { decoded, expired } = verifyJwt(accessToken);

  if (decoded) {
    res.locals.user = decoded;
    req.auth = decoded;
    return next();
  }

  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      res.setHeader("x-access-token", newAccessToken);
    }

    const result = verifyJwt(newAccessToken as string);

    res.locals.user = result.decoded;
    req.auth = result.decoded;
    return next();
  }

  return next();
};

export default deserializeSenseUser;