
import { Types } from "mongoose";

import { BrandModel } from "../models/brand.model";
import { CategoryModel } from "../models/category.model";
import { ProductModel, type ProductDocument } from "../models/product.model";
import type {
    CreateProductInput,
    CreateProductVariantInput,
    UpdateProductInput,
    UpdateProductVariantInput,
} from "../schemas/product.schema";
import { AppError } from "../utils/app-error";
import { isDuplicateKeyError } from "../utils/duplicate-key";
import { createSlug } from "../utils/slug";

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