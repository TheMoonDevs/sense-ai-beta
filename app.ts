var createError = require("http-errors");
var path = require("path");
var cookieParser = require("cookie-parser");
import logger from "morgan";
import express, {
  ErrorRequestHandler,
  Express,
  NextFunction,
  Request,
  Response,
  Router,
} from "express";
import { HttpError } from "http-errors";

import indexRouter from "./routes/index";
import deserializeSenseUser from "./middleware/deserializeUser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utils/swagger";
import userRouter from "./routes/api/v1/userRouter";
import googleAuthRouter from "./routes/api/v1/auth/googleAuthRouter";
import passport from "passport";
import session from "express-session";
import "./middleware/passport";
import { config } from "./config/env.conf";
import socialRouter from "./routes/api/v1/socialRouter";

var app = express();

const routes = {
  authV1:"/auth",
  usersV1: "/users",
  socialV1: "/social",
};

/** third party plugins */
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(deserializeSenseUser);

/** Plugin the routes */

const api_v1 = Router();

app.use(
  session({
    secret: config.secretKey,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/sense_api/v1", api_v1);

// Swagger page
api_v1.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Docs in JSON format
api_v1.get("/docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

console.log(`Docs available at ${config.baseUrl}/sense_api/v1/docs`);

api_v1.use("/", indexRouter);
api_v1.use(`${routes.authV1}`, googleAuthRouter);
api_v1.use(`${routes.usersV1}`, userRouter);
api_v1.use(`${routes.socialV1}`, socialRouter);

app.use(express.json());

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    status: 500,
    message: err.message || "Internal Server Error",
  });
});

export default app;
