
import { z } from "zod";

const mongoObjectIdSchema = z
    .string()
    .regex(
        /^[a-f\d]{24}$/i,
        "Resource ID must be a valid MongoDB ObjectId",
    );

const positiveIntegerQuerySchema = z
    .string()
    .regex(
        /^[1-9]\d*$/,
        "Value must be a positive integer",
    );

export const createReviewSchema = z.object({
    params: z
        .object({ productId: mongoObjectIdSchema })
        .strict(),
    body: z
        .object({
            rating: z.number().int().min(1).max(5),
            comment: z.string().trim().max(1000).optional(),
        })
        .strict(),
});

export const reviewListQuerySchema = z.object({
    params: z
        .object({ productId: mongoObjectIdSchema })
        .strict(),
    query: z
        .object({
            page: positiveIntegerQuerySchema.optional(),
            limit: positiveIntegerQuerySchema
                .refine((value) => Number(value) <= 50, {
                    message: "Limit must be less than or equal to 50",
                })
                .optional(),
        })
        .strict(),
});

export type CreateReviewInput = z.infer<
    typeof createReviewSchema
>["body"];

export type ReviewListQuery = z.infer<
    typeof reviewListQuerySchema
>["query"];