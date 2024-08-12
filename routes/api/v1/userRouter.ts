import { Router } from "express";
import {
  createUserSessionHandler,
  getUserSessionsHandler,
  deleteSessionHandler,
  createEmptySession,
} from "../../../controller/session.controller";
import {
  createUserHandler,
  getCurrentUser,
} from "../../../controller/user.controller";
import requireUser from "../../../middleware/requireUser";
import validateResource from "../../../middleware/validateResource";
import { createSessionSchema } from "../../../schema/session.schema";
import {
  getAudioFileUrl,
  getImageFileUrl,
} from "../../../controller/getFileUrl.controller";
import { s3FileUploadSdk } from "../../../service/s3Upload.service";
import { createUserFromEmailSchema } from "../../../schema/user.schema";

const uploadImageToS3 = s3FileUploadSdk.uploadFile({
  folder: "camera-uploads",
});

const uploadAudioToS3 = s3FileUploadSdk.uploadFile({
  folder: "audio-uploads",
});
const userRouter = Router();

/**
 * @openapi
 * '/sense_api/v1/users/new':
 *  post:
 *     tags:
 *     - User
 *     summary: Register a user
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/CreateUserFromEmailInput'
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateEmailUserResponse'
 *      409:
 *        description: Conflict
 *      400:
 *        description: Bad request
 */
userRouter.post(
  "/new",
  validateResource(createUserFromEmailSchema),
  createUserHandler
);

/**
 * @openapi
 * '/sense_api/v1/users/getCurrent':
 *  get:
 *    tags:
 *    - User
 *    summary: Get current user
 *    responses:
 *      200:
 *        description: Get current user
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GetUserResponse'
 *      403:
 *        description: Forbidden
 */
userRouter.get("/getCurrent", requireUser, getCurrentUser);

/**
 * @openapi
 * '/sense_api/v1/users/sessions':
 *  get:
 *    tags:
 *    - Session
 *    summary: Get all sessions
 *    responses:
 *      200:
 *        description: Get all sessions for current user
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GetSessionResponse'
 *      403:
 *        description: Forbidden
 *  post:
 *    tags:
 *    - Session
 *    summary: Create a session
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CreateSessionInput'
 *    responses:
 *      200:
 *        description: Session created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateSessionResponse'
 *      401:
 *        description: Unauthorized
 *  delete:
 *    tags:
 *    - Session
 *    summary: Delete a session
 *    responses:
 *      200:
 *        description: Session deleted
 *      403:
 *        description: Forbidden
 *
 * post:
 *   tags:
 *    - upload
 *   summary: Upload a file to S3
 *   requestBody:
 *     required: true
 *     content:
 *       multipart/form-data:
 *         schema:
 *           type: object
 *           properties:
 *             file:
 *               type: string
 *               format: binary
 *   responses:
 *     200:
 *       description: File uploaded
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 example: "https://my-bucket.s3.amazonaws.com/my-file.jpg"
 */
userRouter.post(
  "/sessions",
  validateResource(createSessionSchema),
  createUserSessionHandler
);

userRouter.get("/sessions", requireUser, getUserSessionsHandler);

userRouter.delete("/sessions", requireUser, deleteSessionHandler);

/**
 * @openapi
 * '/sense_api/v1/users/empty-session':
 *  get:
 *    tags:
 *    - Session
 *    summary: Create an empty session
 *    responses:
 *      200:
 *        description: Created an empty session
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GetEmptySessionResponse'
 */
userRouter.get("/empty-session", createEmptySession);

/**
 * @openapi
 * '/sense_api/v1/users/empty-session':
 *  get:
 *    tags:
 *    - Session
 *    summary: Create an empty session
 *    responses:
 *      200:
 *        description: Created an empty session
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GetEmptySessionResponse'
 */
userRouter.get("/empty-session", createEmptySession);

userRouter.post(
  "/upload-image",
  uploadImageToS3.single("file"),
  getImageFileUrl
);
userRouter.post(
  "/upload-audio",
  uploadAudioToS3.single("file"),
  getAudioFileUrl
);

// userRouter.post("/speech-to-text", upload.single('file'), speechToText);

export default userRouter;
