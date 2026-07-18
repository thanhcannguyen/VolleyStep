
import { z } from "zod";

const passwordSchema = z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password must contain at most 72 characters")
    .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter",
    )
    .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter",
    )
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character",
    );

export const registerSchema = z
    .object({
        body: z
            .object({
                fullName: z
                    .string()
                    .trim()
                    .min(2, "Full name must contain at least 2 characters")
                    .max(100, "Full name must contain at most 100 characters"),

                email: z
                    .string()
                    .trim()
                    .toLowerCase()
                    .email("Email must be valid")
                    .max(254, "Email must contain at most 254 characters"),

                password: passwordSchema,

                passwordConfirmation: z.string(),
            })
            .strict(),
    })
    .refine(
        ({ body }) =>
            body.password === body.passwordConfirmation,
        {
            path: ["body", "passwordConfirmation"],
            message: "Password confirmation does not match",
        },
    );

export type RegisterInput = z.infer<
    typeof registerSchema
>["body"];