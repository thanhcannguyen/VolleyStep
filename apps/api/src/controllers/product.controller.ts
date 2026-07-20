
import type { RequestHandler } from "express";

import type {
    CreateProductInput,
    CreateProductVariantInput,
    ProductListQuery,
    UpdateProductInput,
    UpdateProductVariantInput,
} from "../schemas/product.schema";
import {
    addProductVariant,
    createProduct,
    deactivateProduct,
    deleteProductVariant,
    getAdminProductById,
    getPublicProductBySlug,
    listPublicProducts,
    updateProduct,
    updateProductVariant,
} from "../services/product.service";

// Định nghĩa params là Record<string, string> tương thích chuẩn Express
type ProductParams = {
    productId: string;
} & Record<string, string>;

type ProductVariantParams = {
    productId: string;
    variantId: string;
} & Record<string, string>;

interface PublicProductSlugParams extends Record<string, string> {
    slug: string;
}

const mapVariantResponse = (variant: {
    _id: { toString(): string };
    sku: string;
    color: string;
    size: string;
    price: number;
    stock: number;
    images: string[];
}) => {
    return {
        id: variant._id.toString(),
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
        images: variant.images,
    };
};

const mapReferenceResponse = (reference: unknown) => {
    if (
        reference &&
        typeof reference === "object" &&
        "_id" in reference &&
        "name" in reference &&
        "slug" in reference
    ) {
        const populatedReference = reference as {
            _id: { toString(): string };
            name: string;
            slug: string;
            isActive?: boolean;
        };

        return {
            id: populatedReference._id.toString(),
            name: populatedReference.name,
            slug: populatedReference.slug,
            isActive: populatedReference.isActive,
        };
    }

    if (
        reference &&
        typeof reference === "object" &&
        "toString" in reference &&
        typeof reference.toString === "function"
    ) {
        return reference.toString();
    }

    return reference;
};

const mapProductResponse = (product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    brandId: unknown;
    categoryId: unknown;
    variants: Array<{
        _id: { toString(): string };
        sku: string;
        color: string;
        size: string;
        price: number;
        stock: number;
        images: string[];
    }>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}) => {
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: mapReferenceResponse(product.brandId),
        category: mapReferenceResponse(product.categoryId),
        variants: product.variants.map(mapVariantResponse),
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
};

// ==========================================
// PUBLIC PRODUCT CONTROLLERS (BƯỚC 11)
// ==========================================

export const listProductsHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    ProductListQuery
> = async (request, response) => {
    const result = await listPublicProducts(request.query);

    response.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: result,
    });
};

export const getProductBySlugHandler: RequestHandler<
    PublicProductSlugParams
> = async (request, response) => {
    const product = await getPublicProductBySlug(request.params.slug);

    response.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data: {
            product,
        },
    });
};

// ==========================================
// ADMIN PRODUCT CONTROLLERS
// ==========================================

export const createProductHandler: RequestHandler<
    Record<string, string>,
    unknown,
    CreateProductInput
> = async (request, response) => {
    const product = await createProduct(request.body);

    response.status(201).json({
        success: true,
        message: "Product created successfully",
        data: {
            product: mapProductResponse(product),
        },
    });
};

export const getAdminProductHandler: RequestHandler<ProductParams> = async (
    request,
    response,
) => {
    const product = await getAdminProductById(request.params.productId);

    response.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data: {
            product: mapProductResponse(product),
        },
    });
};

export const updateProductHandler: RequestHandler<
    ProductParams,
    unknown,
    UpdateProductInput
> = async (request, response) => {
    const product = await updateProduct(
        request.params.productId,
        request.body,
    );

    response.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: {
            product: mapProductResponse(product),
        },
    });
};

export const deleteProductHandler: RequestHandler<ProductParams> = async (
    request,
    response,
) => {
    const product = await deactivateProduct(request.params.productId);

    response.status(200).json({
        success: true,
        message: "Product deactivated successfully",
        data: {
            product: mapProductResponse(product),
        },
    });
};

export const addProductVariantHandler: RequestHandler<
    ProductParams,
    unknown,
    CreateProductVariantInput
> = async (request, response) => {
    const product = await addProductVariant(
        request.params.productId,
        request.body,
    );

    response.status(201).json({
        success: true,
        message: "Product variant created successfully",
        data: {
            product: mapProductResponse(product),
        },
    });
};

export const updateProductVariantHandler: RequestHandler<
    ProductVariantParams,
    unknown,
    UpdateProductVariantInput
> = async (request, response) => {
    const product = await updateProductVariant(
        request.params.productId,
        request.params.variantId,
        request.body,
    );

    response.status(200).json({
        success: true,
        message: "Product variant updated successfully",
        data: {
            product: mapProductResponse(product),
        },
    });
};

export const deleteProductVariantHandler: RequestHandler<
    ProductVariantParams
> = async (request, response) => {
    const product = await deleteProductVariant(
        request.params.productId,
        request.params.variantId,
    );

    response.status(200).json({
        success: true,
        message: "Product variant deleted successfully",
        data: {
            product: mapProductResponse(product),
        },
    });
};