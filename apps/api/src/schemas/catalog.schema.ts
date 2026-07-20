
import { z } from "zod";

const mongoObjectIdSchema = z
    .string()
    .regex(
        /^[a-f\d]{24}$/i,
        "Resource ID must be a valid MongoDB ObjectId",
    );

const brandNameSchema = z
    .string()
    .trim()
    .min(
        2,
        "Brand name must contain at least 2 characters",
    )
    .max(
        80,
        "Brand name must contain at most 80 characters",
    );

const categoryNameSchema = z
    .string()
    .trim()
    .min(
        2,
        "Category name must contain at least 2 characters",
    )
    .max(
        100,
        "Category name must contain at most 100 characters",
    );

const descriptionSchema = z
    .string()
    .trim()
    .max(
        500,
        "Description must contain at most 500 characters",
    );

export const createBrandSchema = z.object({
    body: z
        .object({
            name: brandNameSchema,
            description: descriptionSchema.optional(),
        })
        .strict(),
});

export const updateBrandSchema = z.object({
    params: z.object({
        brandId: mongoObjectIdSchema,
    }),

    body: z
        .object({
            name: brandNameSchema.optional(),
            description: descriptionSchema.optional(),
            isActive: z.boolean().optional(),
        })
        .strict()
        .refine(
            (body) => Object.keys(body).length > 0,
            {
                message: "At least one field must be provided",
            },
        ),
});

export const brandIdParamSchema = z.object({
    params: z.object({
        brandId: mongoObjectIdSchema,
    }),
});

export const createCategorySchema = z.object({
    body: z
        .object({
            name: categoryNameSchema,
            description: descriptionSchema.optional(),
        })
        .strict(),
});

export const updateCategorySchema = z.object({
    params: z.object({
        categoryId: mongoObjectIdSchema,
    }),

    body: z
        .object({
            name: categoryNameSchema.optional(),
            description: descriptionSchema.optional(),
            isActive: z.boolean().optional(),
        })
        .strict()
        .refine(
            (body) => Object.keys(body).length > 0,
            {
                message: "At least one field must be provided",
            },
        ),
});

export const categoryIdParamSchema = z.object({
    params: z.object({
        categoryId: mongoObjectIdSchema,
    }),
});

export type CreateBrandInput = z.infer<
    typeof createBrandSchema
>["body"];

export type UpdateBrandInput = z.infer<
    typeof updateBrandSchema
>["body"];

export type CreateCategoryInput = z.infer<
    typeof createCategorySchema
>["body"];

export type UpdateCategoryInput = z.infer<
    typeof updateCategorySchema
>["body"];