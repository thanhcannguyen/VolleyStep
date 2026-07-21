
import { z } from "zod";
import { COUPON_TYPES } from "../models/coupon.model";

const mongoObjectIdSchema = z
    .string()
    .regex(
        /^[a-f\d]{24}$/i,
        "Resource ID must be a valid MongoDB ObjectId",
    );

export const couponCodeSchema = z
    .string()
    .trim()
    .toUpperCase()
    .regex(
        /^[A-Z0-9_-]{3,20}$/,
        "Coupon code is invalid",
    );

export const couponIdParamSchema = z.object({
    params: z
        .object({ couponId: mongoObjectIdSchema })
        .strict(),
});

export const createCouponSchema = z.object({
    body: z
        .object({
            code: couponCodeSchema,
            type: z.enum(COUPON_TYPES),
            value: z.number().int().positive(),
            minOrderAmount: z.number().int().min(0).default(0),
            maxUsageCount: z.number().int().positive(),
            expiresAt: z.coerce.date(),
        })
        .strict()
        .refine(
            (data) =>
                data.type !== "PERCENTAGE" || data.value <= 100,
            {
                message:
                    "Percentage value must not exceed 100",
                path: ["value"],
            },
        ),
});

export const updateCouponSchema = z.object({
    params: z
        .object({ couponId: mongoObjectIdSchema })
        .strict(),
    body: z
        .object({
            minOrderAmount: z.number().int().min(0).optional(),
            maxUsageCount: z.number().int().positive().optional(),
            expiresAt: z.coerce.date().optional(),
            isActive: z.boolean().optional(),
        })
        .strict(),
});

export type CreateCouponInput = z.infer<
    typeof createCouponSchema
>["body"];

export type UpdateCouponInput = z.infer<
    typeof updateCouponSchema
>["body"];