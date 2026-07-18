
import { z } from "zod";

// 1. Định nghĩa Schema cho Password (Dùng chung cho Register)
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

// 2. Schema cho luồng Đăng ký (Register)
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
            .strict(), // Đã bỏ chuỗi bên trong để tránh lỗi TS2554
    })
    .refine(
        ({ body }) =>
            body.password === body.passwordConfirmation,
        {
            path: ["body", "passwordConfirmation"],
            message: "Password confirmation does not match",
        },
    );

// 3. Schema cho luồng Đăng nhập (Login)
export const loginSchema = z.object({
    body: z
        .object({
            email: z
                .string()
                .trim()
                .toLowerCase()
                .email("Email must be valid")
                .max(254, "Email must contain at most 254 characters"),

            password: z
                .string()
                .min(1, "Password is required"),
        })
        .strict(), // Đã xóa chuỗi tin nhắn để đồng bộ strict mode
});

// 4. Schema cho luồng Làm mới Token (Refresh Token)
export const refreshTokenSchema = z.object({
    body: z
        .object({
            refreshToken: z
                .string()
                .min(1, "Refresh token is required"),
        })
        .strict(), // Đã xóa chuỗi tin nhắn để đồng bộ strict mode
});

// 5. Schema cho luồng Đăng xuất (Logout)
export const logoutSchema = refreshTokenSchema;

// --- EXPORT TYPES ---
export type RegisterInput = z.infer<
    typeof registerSchema
>["body"];

export type LoginInput = z.infer<
    typeof loginSchema
>["body"];

export type RefreshTokenInput = z.infer<
    typeof refreshTokenSchema
>["body"];

export type LogoutInput = z.infer<
    typeof logoutSchema
>["body"];