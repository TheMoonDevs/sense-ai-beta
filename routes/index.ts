/* GET home page. */
import { Request, Response, NextFunction, Router } from "express";
import { version, name, description } from "../package.json";

var router = Router();

router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.status(200);
  res.json({
    success: true,
    name,
    version,
    description,
    message: "Hello Truth Seeker! Welcome to the canvas of knowledge",
  });
});

export default router;
