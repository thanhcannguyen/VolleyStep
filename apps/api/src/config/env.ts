
import path from "node:path";

import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});

const mongoUriSchema = z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
        (value) =>
            value.startsWith("mongodb://") ||
            value.startsWith("mongodb+srv://"),
        {
            message:
                "MONGODB_URI must start with mongodb:// or mongodb+srv://",
        },
    );

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce
        .number()
        .int()
        .positive()
        .max(65535)
        .default(5000),

    MONGODB_URI: mongoUriSchema,
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables:");

    for (const issue of parsedEnv.error.issues) {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }

    process.exit(1);
}

export const env = parsedEnv.data;