
import { z } from "zod";

const mongoObjectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Resource ID must be a valid MongoDB ObjectId");

const cartQuantitySchema = z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be greater than or equal to 1")
    .max(99, "Quantity must be less than or equal to 99");

export const addCartItemSchema = z.object({
    body: z
        .object({
            productId: mongoObjectIdSchema,
            variantId: mongoObjectIdSchema,
            quantity: cartQuantitySchema,
        })
        .strict(),
});

export const updateCartItemSchema = z.object({
    params: z.object({
        itemId: mongoObjectIdSchema,
    }),
    body: z
        .object({
            quantity: cartQuantitySchema,
        })
        .strict(),
});

export const cartItemIdParamSchema = z.object({
    params: z.object({
        itemId: mongoObjectIdSchema,
    }),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>["body"];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>["body"];