import { object, string, TypeOf } from "zod";

/**
 * @openapi
 * components:
 *  schemas:
 *    CreateUserFromEmailInput:
 *      type: object
 *      required:
 *        - email
 *        - name
 *        - password
 *        - passwordConfirmation
 *      properties:
 *        email:
 *          type: string
 *          format: email
 *          description: The user's email address.
 *          default: jane.doe@example.com
 *        name:
 *          type: string
 *          description: The user's full name.
 *          default: Jane Doe
 *        profile_url:
 *          type: string
 *          description: URL to the user's profile picture.
 *          default: https://example.com/profile.jpg
 *        password:
 *          type: string
 *          description: The user's password.
 *          default: stringPassword123
 *        passwordConfirmation:
 *          type: string
 *          description: Confirmation of the user's password.
 *          default: stringPassword123
 *    CreateEmailUserResponse:
 *      type: object
 *      properties:
 *        email:
 *          type: string
 *        name:
 *          type: string
 *        profile_url:
 *          type: string
 *          default: https://example.com/profile.jpg
 *        _id:
 *          type: string
 *        createdAt:
 *          type: string
 *        updatedAt:
 *          type: string
 *    GetUserResponse:
 *      type: object
 *      properties:
 *        email:
 *          type: string
 *        name:
 *          type: string
 *        profile_url:
 *          type: string
 *          default: https://example.com/profile.jpg
 *        _id:
 *          type: string
 *        createdAt:
 *          type: string
 *        updatedAt:
 *          type: string
 *  */

export const createUserFromEmailSchema = object({
  body: object({
    name: string({
      required_error: "Name is required",
    }),
    email: string({
      required_error: "Email is required",
    }).email("Not a valid email"),
    password: string({
      required_error: "Password is required",
    }).min(6, "Password too short - should be 6 chars minimum"),
    passwordConfirmation: string({
      required_error: "Password confirmation is required",
    }),
    profile_url: string().optional(),
  }).refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  }),
});

export type CreateUserFromEmailInput = Omit<
  TypeOf<typeof createUserFromEmailSchema>,
  "body.passwordConfirmation"
>;
