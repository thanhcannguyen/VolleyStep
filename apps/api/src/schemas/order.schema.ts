
import { z } from "zod";

const requiredText = (fieldName: string, maximumLength: number) =>
    z
        .string()
        .trim()
        .min(1, `${fieldName} is required`)
        .max(
            maximumLength,
            `${fieldName} must contain at most ${maximumLength} characters`,
        );

const optionalText = (fieldName: string, maximumLength: number) =>
    z
        .string()
        .trim()
        .min(1, `${fieldName} must not be empty`)
        .max(
            maximumLength,
            `${fieldName} must contain at most ${maximumLength} characters`,
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

export const checkoutSchema = z.object({
    body: z
        .object({
            shippingAddress: shippingAddressSchema,
        })
        .strict(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>["body"];