
import { z } from "zod";
import { ORDER_STATUSES } from "../models/order.model";
import { couponCodeSchema } from "./coupon.schema";

// --- Helper Functions & Sub-schemas hiện có ---
const requiredText = (fieldName: string, maximumLength: number) =>
    z
        .string()
        .trim()
        .min(1, `${fieldName} is required`)
        .max(
            maximumLength,
            `${fieldName} must contain at most ${maximumLength} characters`
        );

const optionalText = (fieldName: string, maximumLength: number) =>
    z
        .string()
        .trim()
        .min(1, `${fieldName} must not be empty`)
        .max(
            maximumLength,
            `${fieldName} must contain at most ${maximumLength} characters`
        )
        .optional();

const vietnamPhoneSchema = z
    .string()
    .trim()
    .regex(/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/, "Phone number is invalid");

const shippingAddressSchema = z
    .object({
        recipientName: requiredText("Recipient name", 100),
        phone: vietnamPhoneSchema,
        addressLine: requiredText("Address line", 200),
        ward: optionalText("Ward", 100),
        district: requiredText("District", 100),
        province: requiredText("Province", 100),
        postalCode: z
            .string()
            .trim()
            .regex(/^\d{5,6}$/, "Postal code is invalid")
            .optional(),
    })
    .strict();

// --- Phase 12 Common Query & Param Helpers ---
const mongoObjectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Resource ID must be a valid MongoDB ObjectId");

const positiveIntegerQuerySchema = z
    .string()
    .regex(/^[1-9]\d*$/, "Value must be a positive integer");

const orderStatusSchema = z.enum(ORDER_STATUSES);

// --- Checkout Schema (Phase 11) ---
export const checkoutSchema = z.object({
    body: z
        .object({
            shippingAddress: shippingAddressSchema,
            couponCode: couponCodeSchema.optional(),
        })
        .strict(),
});

// --- Order Schemas (Phase 12) ---
export const orderIdParamSchema = z.object({
    params: z
        .object({
            orderId: mongoObjectIdSchema,
        })
        .strict(),
});

export const orderListQuerySchema = z.object({
    query: z
        .object({
            page: positiveIntegerQuerySchema.optional(),
            limit: positiveIntegerQuerySchema
                .refine((value) => Number(value) <= 50, {
                    message: "Limit must be less than or equal to 50",
                })
                .optional(),
            status: orderStatusSchema.optional(),
        })
        .strict(),
});

export const adminOrderListQuerySchema = z.object({
    query: z
        .object({
            page: positiveIntegerQuerySchema.optional(),
            limit: positiveIntegerQuerySchema
                .refine((value) => Number(value) <= 100, {
                    message: "Limit must be less than or equal to 100",
                })
                .optional(),
            status: orderStatusSchema.optional(),
            userId: mongoObjectIdSchema.optional(),
        })
        .strict(),
});

export const updateOrderStatusSchema = z.object({
    params: z
        .object({
            orderId: mongoObjectIdSchema,
        })
        .strict(),
    body: z
        .object({
            status: orderStatusSchema,
        })
        .strict(),
});

// --- Type Exports ---
export type CheckoutInput = z.infer<typeof checkoutSchema>["body"];
export type OrderListQuery = z.infer<typeof orderListQuerySchema>["query"];
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>["query"];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;