
import type { PipelineStage } from "mongoose";
import { Types } from "mongoose";

import { BrandModel } from "../models/brand.model";
import { CategoryModel } from "../models/category.model";
import { ProductModel, type ProductDocument } from "../models/product.model";
import type {
    CreateProductInput,
    CreateProductVariantInput,
    ProductListQuery,
    UpdateProductInput,
    UpdateProductVariantInput,
} from "../schemas/product.schema";
import { AppError } from "../utils/app-error";
import { isDuplicateKeyError } from "../utils/duplicate-key";
import { createSlug } from "../utils/slug";

// ==========================================
// INTERFACES FOR PUBLIC PRODUCT CATALOG
// ==========================================

interface PublicProductReference {
    id: string;
    name: string;
    slug: string;
}

export interface PublicProductListItem {
    id: string;
    name: string;
    slug: string;
    brand: PublicProductReference;
    category: PublicProductReference;
    minPrice: number;
    maxPrice: number;
    totalStock: number;
    availableColors: string[];
    availableSizes: string[];
    thumbnail: string | null;
    createdAt: Date;
}

export interface PublicProductDetail {
    id: string;
    name: string;
    slug: string;
    description: string;
    brand: PublicProductReference;
    category: PublicProductReference;
    variants: Array<{
        id: string;
        sku: string;
        color: string;
        size: string;
        price: number;
        stock: number;
        images: string[];
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface PublicProductListResult {
    products: PublicProductListItem[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

interface ProductListAggregationResult {
    data: PublicProductListItem[];
    metadata: Array<{
        totalItems: number;
    }>;
}

interface PublicProductDetailAggregation {
    id: string;
    name: string;
    slug: string;
    description: string;
    brand: PublicProductReference;
    category: PublicProductReference;
    variants: Array<{
        id: string;
        sku: string;
        color: string;
        size: string;
        price: number;
        stock: number;
        images: string[];
    }>;
    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// HELPER FUNCTIONS FOR ADMIN
// ==========================================

const assertActiveBrandExists = async (brandId: string): Promise<void> => {
    const brand = await BrandModel.exists({
        _id: brandId,
        isActive: true,
    });

    if (!brand) {
        throw new AppError("Active brand not found", 400);
    }
};

const assertActiveCategoryExists = async (categoryId: string): Promise<void> => {
    const category = await CategoryModel.exists({
        _id: categoryId,
        isActive: true,
    });

    if (!category) {
        throw new AppError("Active category not found", 400);
    }
};

const assertSkuDoesNotExist = async (
    sku: string,
    ignoredProductId?: string,
): Promise<void> => {
    const query: {
        "variants.sku": string;
        _id?: { $ne: Types.ObjectId };
    } = {
        "variants.sku": sku,
    };

    if (ignoredProductId) {
        query._id = { $ne: new Types.ObjectId(ignoredProductId) };
    }

    const existingProduct = await ProductModel.exists(query);

    if (existingProduct) {
        throw new AppError(`Variant SKU ${sku} already exists`, 409);
    }
};

const handleProductDuplicateError = (error: unknown): never => {
    if (isDuplicateKeyError(error)) {
        throw new AppError("Product slug or variant SKU already exists", 409);
    }
    throw error;
};

// ==========================================
// ADMIN PRODUCT SERVICES
// ==========================================

export const createProduct = async (
    input: CreateProductInput,
): Promise<ProductDocument> => {
    await Promise.all([
        assertActiveBrandExists(input.brandId),
        assertActiveCategoryExists(input.categoryId),
    ]);

    const slug = createSlug(input.name);

    const existingProduct = await ProductModel.exists({ slug });

    if (existingProduct) {
        throw new AppError("Product already exists", 409);
    }

    for (const variant of input.variants) {
        await assertSkuDoesNotExist(variant.sku);
    }

    try {
        return await ProductModel.create({
            name: input.name,
            slug,
            description: input.description,
            brandId: input.brandId,
            categoryId: input.categoryId,
            variants: input.variants,
        });
    } catch (error: unknown) {
        return handleProductDuplicateError(error);
    }
};

export const getAdminProductById = async (
    productId: string,
): Promise<ProductDocument> => {
    const product = await ProductModel.findById(productId)
        .populate({
            path: "brandId",
            select: "name slug isActive",
        })
        .populate({
            path: "categoryId",
            select: "name slug isActive",
        });

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    return product;
};

export const updateProduct = async (
    productId: string,
    input: UpdateProductInput,
): Promise<ProductDocument> => {
    const product = await ProductModel.findById(productId);

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    if (input.brandId !== undefined) {
        await assertActiveBrandExists(input.brandId);
        product.brandId = new Types.ObjectId(input.brandId);
    }

    if (input.categoryId !== undefined) {
        await assertActiveCategoryExists(input.categoryId);
        product.categoryId = new Types.ObjectId(input.categoryId);
    }

    if (input.name !== undefined) {
        const slug = createSlug(input.name);

        const duplicateProduct = await ProductModel.exists({
            slug,
            _id: { $ne: product._id },
        });

        if (duplicateProduct) {
            throw new AppError("Product already exists", 409);
        }

        product.name = input.name;
        product.slug = slug;
    }

    if (input.description !== undefined) {
        product.description = input.description;
    }

    if (input.isActive !== undefined) {
        product.isActive = input.isActive;
    }

    try {
        await product.save();
        return product;
    } catch (error: unknown) {
        return handleProductDuplicateError(error);
    }
};

export const deactivateProduct = async (
    productId: string,
): Promise<ProductDocument> => {
    const product = await ProductModel.findById(productId);

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    if (!product.isActive) {
        return product;
    }

    product.isActive = false;

    await product.save();

    return product;
};

export const addProductVariant = async (
    productId: string,
    input: CreateProductVariantInput,
): Promise<ProductDocument> => {
    const product = await ProductModel.findById(productId);

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    const normalizedSku = input.sku.toUpperCase();

    const duplicateInsideProduct = product.variants.some(
        (variant) => variant.sku === normalizedSku,
    );

    if (duplicateInsideProduct) {
        throw new AppError(`Variant SKU ${normalizedSku} already exists`, 409);
    }

    await assertSkuDoesNotExist(normalizedSku);

    product.variants.push({
        _id: new Types.ObjectId(),
        sku: normalizedSku,
        color: input.color,
        size: input.size,
        price: input.price,
        stock: input.stock,
        images: [...input.images],
    });

    try {
        await product.save();
        return product;
    } catch (error: unknown) {
        return handleProductDuplicateError(error);
    }
};

export const updateProductVariant = async (
    productId: string,
    variantId: string,
    input: UpdateProductVariantInput,
): Promise<ProductDocument> => {
    const product = await ProductModel.findById(productId);

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    const variant = product.variants.find(
        (item) => item._id.toString() === variantId,
    );

    if (!variant) {
        throw new AppError("Product variant not found", 404);
    }

    if (input.sku !== undefined) {
        const normalizedSku = input.sku.toUpperCase();

        const duplicateInsideProduct = product.variants.some(
            (item) =>
                item._id.toString() !== variantId && item.sku === normalizedSku,
        );

        if (duplicateInsideProduct) {
            throw new AppError(`Variant SKU ${normalizedSku} already exists`, 409);
        }

        await assertSkuDoesNotExist(normalizedSku, productId);

        variant.sku = normalizedSku;
    }

    if (input.color !== undefined) {
        variant.color = input.color;
    }

    if (input.size !== undefined) {
        variant.size = input.size;
    }

    if (input.price !== undefined) {
        variant.price = input.price;
    }

    if (input.stock !== undefined) {
        variant.stock = input.stock;
    }

    if (input.images !== undefined) {
        variant.images = [...input.images];
    }

    try {
        await product.save();
        return product;
    } catch (error: unknown) {
        return handleProductDuplicateError(error);
    }
};

export const deleteProductVariant = async (
    productId: string,
    variantId: string,
): Promise<ProductDocument> => {
    const product = await ProductModel.findById(productId);

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    const variantIndex = product.variants.findIndex(
        (variant) => variant._id.toString() === variantId,
    );

    if (variantIndex === -1) {
        throw new AppError("Product variant not found", 404);
    }

    if (product.variants.length === 1) {
        throw new AppError("Product must contain at least one variant", 400);
    }

    product.variants.splice(variantIndex, 1);

    await product.save();

    return product;
};

// ==========================================
// HELPER FUNCTIONS FOR PUBLIC AGGREGATION
// ==========================================

const escapeRegularExpression = (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createExactCaseInsensitiveExpression = (value: string): RegExp => {
    return new RegExp(`^${escapeRegularExpression(value)}$`, "i");
};

const createProductLookupStages = (): PipelineStage[] => {
    return [
        {
            $lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brand",
            },
        },
        {
            $unwind: "$brand",
        },
        {
            $match: {
                "brand.isActive": true,
            },
        },
        {
            $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category",
            },
        },
        {
            $unwind: "$category",
        },
        {
            $match: {
                "category.isActive": true,
            },
        },
    ];
};

const createProductListSort = (
    sort: ProductListQuery["sort"],
    hasSearch: boolean,
): Record<string, 1 | -1> => {
    switch (sort) {
        case "oldest":
            return {
                createdAt: 1,
                _id: 1,
            };

        case "price_asc":
            return {
                minPrice: 1,
                _id: 1,
            };

        case "price_desc":
            return {
                minPrice: -1,
                _id: -1,
            };

        case "name_asc":
            return {
                name: 1,
                _id: 1,
            };

        case "name_desc":
            return {
                name: -1,
                _id: -1,
            };

        case "relevance":
            if (hasSearch) {
                return {
                    relevanceScore: -1,
                    _id: -1,
                };
            }

            return {
                createdAt: -1,
                _id: -1,
            };

        case "newest":
        default:
            if (hasSearch && sort === undefined) {
                return {
                    relevanceScore: -1,
                    _id: -1,
                };
            }

            return {
                createdAt: -1,
                _id: -1,
            };
    }
};

// ==========================================
// PUBLIC CATALOG PRODUCT SERVICES
// ==========================================

export const listPublicProducts = async (
    query: ProductListQuery,
): Promise<PublicProductListResult> => {
    const page = Number(query.page ?? "1");
    const limit = Number(query.limit ?? "12");
    const skip = (page - 1) * limit;

    const search = query.search?.trim();
    const brand = query.brand?.trim().toLowerCase();
    const category = query.category?.trim().toLowerCase();
    const color = query.color?.trim();
    const size = query.size?.trim();

    const initialMatch: Record<string, unknown> = {
        isActive: true,
    };

    if (search) {
        initialMatch.$text = {
            $search: search,
        };
    }

    const variantMatch: Record<string, unknown> = {};

    if (color) {
        variantMatch.color = createExactCaseInsensitiveExpression(color);
    }

    if (size) {
        variantMatch.size = createExactCaseInsensitiveExpression(size);
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        const priceCondition: {
            $gte?: number;
            $lte?: number;
        } = {};

        if (query.minPrice !== undefined) {
            priceCondition.$gte = Number(query.minPrice);
        }

        if (query.maxPrice !== undefined) {
            priceCondition.$lte = Number(query.maxPrice);
        }

        variantMatch.price = priceCondition;
    }

    if (Object.keys(variantMatch).length > 0) {
        initialMatch.variants = {
            $elemMatch: variantMatch,
        };
    }

    const pipeline: PipelineStage[] = [
        {
            $match: initialMatch,
        },
    ];

    if (search) {
        pipeline.push({
            $addFields: {
                relevanceScore: {
                    $meta: "textScore",
                },
            },
        });
    }

    pipeline.push(...createProductLookupStages());

    const catalogMatch: Record<string, unknown> = {};

    if (brand) {
        catalogMatch["brand.slug"] = brand;
    }

    if (category) {
        catalogMatch["category.slug"] = category;
    }

    if (Object.keys(catalogMatch).length > 0) {
        pipeline.push({
            $match: catalogMatch,
        });
    }

    pipeline.push(
        {
            $addFields: {
                minPrice: {
                    $min: "$variants.price",
                },
                maxPrice: {
                    $max: "$variants.price",
                },
                totalStock: {
                    $sum: "$variants.stock",
                },
                availableColors: {
                    $setUnion: ["$variants.color", []],
                },
                availableSizes: {
                    $setUnion: ["$variants.size", []],
                },
                thumbnail: {
                    $let: {
                        vars: {
                            firstVariant: {
                                $arrayElemAt: ["$variants", 0],
                            },
                        },
                        in: {
                            $arrayElemAt: ["$$firstVariant.images", 0],
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                id: {
                    $toString: "$_id",
                },
                name: 1,
                slug: 1,
                brand: {
                    id: {
                        $toString: "$brand._id",
                    },
                    name: "$brand.name",
                    slug: "$brand.slug",
                },
                category: {
                    id: {
                        $toString: "$category._id",
                    },
                    name: "$category.name",
                    slug: "$category.slug",
                },
                minPrice: 1,
                maxPrice: 1,
                totalStock: 1,
                availableColors: 1,
                availableSizes: 1,
                thumbnail: {
                    $ifNull: ["$thumbnail", null],
                },
                createdAt: 1,
                relevanceScore: 1,
            },
        },
        {
            $facet: {
                data: [
                    {
                        $sort: createProductListSort(query.sort, Boolean(search)),
                    },
                    {
                        $skip: skip,
                    },
                    {
                        $limit: limit,
                    },
                    {
                        $project: {
                            relevanceScore: 0,
                        },
                    },
                ],
                metadata: [
                    {
                        $count: "totalItems",
                    },
                ],
            },
        },
    );

    const [result] =
        await ProductModel.aggregate<ProductListAggregationResult>(pipeline);

    const products = result?.data ?? [];

    const totalItems = result?.metadata[0]?.totalItems ?? 0;

    const totalPages =
        totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
        products,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: totalPages > 0 && page > 1,
        },
    };
};

export const getPublicProductBySlug = async (
    slug: string,
): Promise<PublicProductDetail> => {
    const pipeline: PipelineStage[] = [
        {
            $match: {
                slug,
                isActive: true,
            },
        },
        ...createProductLookupStages(),
        {
            $project: {
                _id: 0,
                id: {
                    $toString: "$_id",
                },
                name: 1,
                slug: 1,
                description: 1,
                brand: {
                    id: {
                        $toString: "$brand._id",
                    },
                    name: "$brand.name",
                    slug: "$brand.slug",
                },
                category: {
                    id: {
                        $toString: "$category._id",
                    },
                    name: "$category.name",
                    slug: "$category.slug",
                },
                variants: {
                    $map: {
                        input: "$variants",
                        as: "variant",
                        in: {
                            id: {
                                $toString: "$$variant._id",
                            },
                            sku: "$$variant.sku",
                            color: "$$variant.color",
                            size: "$$variant.size",
                            price: "$$variant.price",
                            stock: "$$variant.stock",
                            images: "$$variant.images",
                        },
                    },
                },
                createdAt: 1,
                updatedAt: 1,
            },
        },
        {
            $limit: 1,
        },
    ];

    const [product] =
        await ProductModel.aggregate<PublicProductDetailAggregation>(pipeline);

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    return product;
};