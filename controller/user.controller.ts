import { Request, Response } from "express";
import { CreateUserFromEmailInput } from "../schema/user.schema";
import { createUser } from "../service/user.service";
import UserModel from "../models/user.model";

export async function createUserHandler(
  req: Request<{}, {}, CreateUserFromEmailInput["body"]>,
  res: Response
) {
  try {
    const user = await createUser(req.body);
    return res.send(user);
  } catch (e: any) {
    console.log(e);
    return res.status(409).send(e.message);
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  if (req.query.fetchNew === "true") {
    const user = await UserModel.findById((res.locals.user || req.user)._id);
    return res.send(user);
  } else {
    return res.send(res.locals.user || req.user);
  }
}
