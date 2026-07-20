
import { z } from "zod";

const mongoObjectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Resource ID must be a valid MongoDB ObjectId");

const productNameSchema = z
    .string()
    .trim()
    .min(2, "Product name must contain at least 2 characters")
    .max(150, "Product name must contain at most 150 characters");

const productDescriptionSchema = z
    .string()
    .trim()
    .min(10, "Product description must contain at least 10 characters")
    .max(5000, "Product description must contain at most 5000 characters");

const skuSchema = z
    .string()
    .trim()
    .min(2, "Variant SKU must contain at least 2 characters")
    .max(80, "Variant SKU must contain at most 80 characters")
    .transform((sku) => sku.toUpperCase());

const colorSchema = z
    .string()
    .trim()
    .min(1, "Variant color is required")
    .max(50, "Variant color must contain at most 50 characters");

const sizeSchema = z
    .string()
    .trim()
    .min(1, "Variant size is required")
    .max(20, "Variant size must contain at most 20 characters");

const priceSchema = z
    .number()
    .int("Variant price must be an integer in VND")
    .nonnegative("Variant price must be greater than or equal to 0");

const stockSchema = z
    .number()
    .int("Variant stock must be an integer")
    .nonnegative("Variant stock must be greater than or equal to 0");

const imageSchema = z
    .string()
    .trim()
    .url("Variant image must be a valid URL");

const createVariantBodySchema = z
    .object({
        sku: skuSchema,
        color: colorSchema,
        size: sizeSchema,
        price: priceSchema,
        stock: stockSchema,
        images: z
            .array(imageSchema)
            .min(1, "Variant must contain at least one image")
            .max(10, "Variant must contain at most 10 images"),
    })
    .strict();

const updateVariantBodySchema = z
    .object({
        sku: skuSchema.optional(),
        color: colorSchema.optional(),
        size: sizeSchema.optional(),
        price: priceSchema.optional(),
        stock: stockSchema.optional(),
        images: z
            .array(imageSchema)
            .min(1, "Variant must contain at least one image")
            .max(10, "Variant must contain at most 10 images")
            .optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
        message: "At least one field must be provided",
    });

export const createProductSchema = z.object({
    body: z
        .object({
            name: productNameSchema,
            description: productDescriptionSchema,
            brandId: mongoObjectIdSchema,
            categoryId: mongoObjectIdSchema,
            variants: z
                .array(createVariantBodySchema)
                .min(1, "Product must contain at least one variant")
                .max(100, "Product must contain at most 100 variants"),
        })
        .strict()
        .superRefine((body, context) => {
            const skuSet = new Set<string>();

            body.variants.forEach((variant, index) => {
                if (skuSet.has(variant.sku)) {
                    context.addIssue({
                        code: "custom",
                        path: ["variants", index, "sku"],
                        message: "Variant SKU must be unique within the product",
                    });
                    return;
                }

                skuSet.add(variant.sku);
            });
        }),
});

export const productIdParamSchema = z.object({
    params: z.object({
        productId: mongoObjectIdSchema,
    }),
});

export const updateProductSchema = z.object({
    params: z.object({
        productId: mongoObjectIdSchema,
    }),
    body: z
        .object({
            name: productNameSchema.optional(),
            description: productDescriptionSchema.optional(),
            brandId: mongoObjectIdSchema.optional(),
            categoryId: mongoObjectIdSchema.optional(),
            isActive: z.boolean().optional(),
        })
        .strict()
        .refine((body) => Object.keys(body).length > 0, {
            message: "At least one field must be provided",
        }),
});

export const createProductVariantSchema = z.object({
    params: z.object({
        productId: mongoObjectIdSchema,
    }),
    body: createVariantBodySchema,
});

export const updateProductVariantSchema = z.object({
    params: z.object({
        productId: mongoObjectIdSchema,
        variantId: mongoObjectIdSchema,
    }),
    body: updateVariantBodySchema,
});

export const deleteProductVariantSchema = z.object({
    params: z.object({
        productId: mongoObjectIdSchema,
        variantId: mongoObjectIdSchema,
    }),
});

/* ===========================
   Phase 9 - Public Product API
=========================== */

const positiveIntegerQuerySchema = z
    .string()
    .regex(
        /^[1-9]\d*$/,
        "Value must be a positive integer",
    );

const nonNegativeIntegerQuerySchema = z
    .string()
    .regex(
        /^\d+$/,
        "Value must be a non-negative integer",
    );

const productFilterTextSchema = z
    .string()
    .trim()
    .min(1, "Filter value must not be empty")
    .max(
        100,
        "Filter value must contain at most 100 characters",
    );

export const productListQuerySchema = z
    .object({
        query: z
            .object({
                page: positiveIntegerQuerySchema.optional(),

                limit: positiveIntegerQuerySchema
                    .refine(
                        (value) => Number(value) <= 100,
                        {
                            message:
                                "Limit must be less than or equal to 100",
                        },
                    )
                    .optional(),

                search: z
                    .string()
                    .trim()
                    .min(
                        2,
                        "Search must contain at least 2 characters",
                    )
                    .max(
                        100,
                        "Search must contain at most 100 characters",
                    )
                    .optional(),

                brand:
                    productFilterTextSchema.optional(),

                category:
                    productFilterTextSchema.optional(),

                color:
                    productFilterTextSchema.optional(),

                size:
                    productFilterTextSchema.optional(),

                minPrice:
                    nonNegativeIntegerQuerySchema.optional(),

                maxPrice:
                    nonNegativeIntegerQuerySchema.optional(),

                sort: z
                    .enum([
                        "newest",
                        "oldest",
                        "price_asc",
                        "price_desc",
                        "name_asc",
                        "name_desc",
                        "relevance",
                    ])
                    .optional(),
            })
            .strict(),
    })
    .superRefine((input, context) => {
        if (
            input.query.minPrice !== undefined &&
            input.query.maxPrice !== undefined &&
            Number(input.query.minPrice) >
            Number(input.query.maxPrice)
        ) {
            context.addIssue({
                code: "custom",
                path: ["query", "maxPrice"],
                message:
                    "Maximum price must be greater than or equal to minimum price",
            });
        }
    });

export const publicProductSlugSchema = z.object({
    params: z.object({
        slug: z
            .string()
            .trim()
            .min(1, "Product slug is required")
            .max(
                200,
                "Product slug must contain at most 200 characters",
            )
            .regex(
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                "Product slug is invalid",
            ),
    }),
});

export type CreateProductInput =
    z.infer<typeof createProductSchema>["body"];

export type UpdateProductInput =
    z.infer<typeof updateProductSchema>["body"];

export type CreateProductVariantInput =
    z.infer<typeof createProductVariantSchema>["body"];

export type UpdateProductVariantInput =
    z.infer<typeof updateProductVariantSchema>["body"];

export type ProductListQuery =
    z.infer<typeof productListQuerySchema>["query"];