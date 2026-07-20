
import { Types, type FlattenMaps } from "mongoose";

import { BrandModel } from "../models/brand.model";
import { CartModel, type CartDocument } from "../models/cart.model";
import { CategoryModel } from "../models/category.model";
import {
    ProductModel,
    type Product,
    type ProductVariant,
} from "../models/product.model";
import type {
    AddCartItemInput,
    UpdateCartItemInput,
} from "../schemas/cart.schema";
import { AppError } from "../utils/app-error";
import { isDuplicateKeyError } from "../utils/duplicate-key";

interface SellableVariantResult {
    product: {
        id: string;
        name: string;
        slug: string;
    };
    variant: ProductVariant;
}

type LeanProduct = FlattenMaps<Product> & {
    _id: Types.ObjectId;
};

export interface CartResponseItem {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    currentPrice: number;
    lineTotal: number;
    priceChanged: boolean;
    available: boolean;
    unavailableReason: string | null;
    product: {
        name: string;
        slug: string;
    } | null;
    variant: {
        sku: string;
        color: string;
        size: string;
        price: number;
        stock: number;
        images: string[];
    } | null;
}

export interface CartResponse {
    id: string;
    userId: string;
    items: CartResponseItem[];
    summary: {
        totalItems: number;
        totalQuantity: number;
        availableItems: number;
        subtotal: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const getOrCreateCart = async (userId: string): Promise<CartDocument> => {
    const existingCart = await CartModel.findOne({ userId });

    if (existingCart) {
        return existingCart;
    }

    try {
        return await CartModel.create({
            userId,
            items: [],
        });
    } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
            const cart = await CartModel.findOne({ userId });
            if (cart) {
                return cart;
            }
        }
        throw error;
    }
};

const getSellableVariant = async (
    productId: string,
    variantId: string
): Promise<SellableVariantResult> => {
    const product = await ProductModel.findOne({
        _id: productId,
        isActive: true,
        "variants._id": variantId,
    });

    if (!product) {
        throw new AppError("Product variant is not available", 404);
    }

    const [activeBrand, activeCategory] = await Promise.all([
        BrandModel.exists({ _id: product.brandId, isActive: true }),
        CategoryModel.exists({ _id: product.categoryId, isActive: true }),
    ]);

    if (!activeBrand || !activeCategory) {
        throw new AppError("Product variant is not available", 409);
    }

    const variant = product.variants.find(
        (item) => item._id.toString() === variantId
    );

    if (!variant) {
        throw new AppError("Product variant is not available", 404);
    }

    if (variant.stock <= 0) {
        throw new AppError("Product variant is out of stock", 409);
    }

    return {
        product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
        },
        variant,
    };
};

const findCartItem = (cart: CartDocument, itemId: string) => {
    return cart.items.find((item) => item._id.toString() === itemId);
};

export const getCart = async (userId: string): Promise<CartResponse> => {
    const cart = await getOrCreateCart(userId);

    if (cart.items.length === 0) {
        return {
            id: cart.id,
            userId: cart.userId.toString(),
            items: [],
            summary: {
                totalItems: 0,
                totalQuantity: 0,
                availableItems: 0,
                subtotal: 0,
            },
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
        };
    }

    const productIds = [
        ...new Set(cart.items.map((item) => item.productId.toString())),
    ];

    const products = await ProductModel.find({
        _id: { $in: productIds },
    }).lean();

    const brandIds = [
        ...new Set(products.map((product) => product.brandId.toString())),
    ];

    const categoryIds = [
        ...new Set(products.map((product) => product.categoryId.toString())),
    ];

    const [activeBrands, activeCategories] = await Promise.all([
        BrandModel.find({ _id: { $in: brandIds }, isActive: true })
            .select("_id")
            .lean(),
        CategoryModel.find({ _id: { $in: categoryIds }, isActive: true })
            .select("_id")
            .lean(),
    ]);

    const activeBrandIds = new Set(
        activeBrands.map((brand) => brand._id.toString())
    );

    const activeCategoryIds = new Set(
        activeCategories.map((category) => category._id.toString())
    );

    const productMap = new Map<string, LeanProduct>(
        products.map((product) => [
            product._id.toString(),
            product as LeanProduct,
        ])
    );

    let shouldSaveCart = false;

    const responseItems: CartResponseItem[] = cart.items.map((cartItem) => {
        const product = productMap.get(cartItem.productId.toString());

        if (!product) {
            return {
                id: cartItem._id.toString(),
                productId: cartItem.productId.toString(),
                variantId: cartItem.variantId.toString(),
                quantity: cartItem.quantity,
                currentPrice: cartItem.currentPrice,
                lineTotal: cartItem.currentPrice * cartItem.quantity,
                priceChanged: false,
                available: false,
                unavailableReason: "PRODUCT_NOT_FOUND",
                product: null,
                variant: null,
            };
        }

        const variant = product.variants.find(
            (item) => item._id.toString() === cartItem.variantId.toString()
        );

        if (!variant) {
            return {
                id: cartItem._id.toString(),
                productId: cartItem.productId.toString(),
                variantId: cartItem.variantId.toString(),
                quantity: cartItem.quantity,
                currentPrice: cartItem.currentPrice,
                lineTotal: cartItem.currentPrice * cartItem.quantity,
                priceChanged: false,
                available: false,
                unavailableReason: "VARIANT_NOT_FOUND",
                product: {
                    name: product.name,
                    slug: product.slug,
                },
                variant: null,
            };
        }

        const priceChanged = cartItem.currentPrice !== variant.price;

        if (priceChanged) {
            cartItem.currentPrice = variant.price;
            shouldSaveCart = true;
        }

        let unavailableReason: string | null = null;

        if (!product.isActive) {
            unavailableReason = "PRODUCT_INACTIVE";
        } else if (!activeBrandIds.has(product.brandId.toString())) {
            unavailableReason = "BRAND_INACTIVE";
        } else if (!activeCategoryIds.has(product.categoryId.toString())) {
            unavailableReason = "CATEGORY_INACTIVE";
        } else if (variant.stock <= 0) {
            unavailableReason = "OUT_OF_STOCK";
        } else if (cartItem.quantity > variant.stock) {
            unavailableReason = "INSUFFICIENT_STOCK";
        }

        const available = unavailableReason === null;

        return {
            id: cartItem._id.toString(),
            productId: cartItem.productId.toString(),
            variantId: cartItem.variantId.toString(),
            quantity: cartItem.quantity,
            currentPrice: variant.price,
            lineTotal: variant.price * cartItem.quantity,
            priceChanged,
            available,
            unavailableReason,
            product: {
                name: product.name,
                slug: product.slug,
            },
            variant: {
                sku: variant.sku,
                color: variant.color,
                size: variant.size,
                price: variant.price,
                stock: variant.stock,
                images: variant.images,
            },
        };
    });

    if (shouldSaveCart) {
        cart.markModified("items");
        await cart.save();
    }

    const totalQuantity = responseItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const availableItems = responseItems.filter((item) => item.available).length;

    const subtotal = responseItems.reduce((total, item) => {
        if (!item.available) {
            return total;
        }
        return total + item.lineTotal;
    }, 0);

    return {
        id: cart.id,
        userId: cart.userId.toString(),
        items: responseItems,
        summary: {
            totalItems: responseItems.length,
            totalQuantity,
            availableItems,
            subtotal,
        },
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
    };
};

export const addCartItem = async (
    userId: string,
    input: AddCartItemInput
): Promise<CartResponse> => {
    const { variant } = await getSellableVariant(
        input.productId,
        input.variantId
    );

    const cart = await getOrCreateCart(userId);

    const existingItem = cart.items.find(
        (item) =>
            item.productId.toString() === input.productId &&
            item.variantId.toString() === input.variantId
    );

    if (existingItem) {
        const nextQuantity = existingItem.quantity + input.quantity;

        if (nextQuantity > 99) {
            throw new AppError("Cart item quantity must not exceed 99", 400);
        }

        if (nextQuantity > variant.stock) {
            throw new AppError("Requested quantity exceeds available stock", 409);
        }

        existingItem.quantity = nextQuantity;
        existingItem.currentPrice = variant.price;
    } else {
        if (input.quantity > variant.stock) {
            throw new AppError("Requested quantity exceeds available stock", 409);
        }

        cart.items.push({
            _id: new Types.ObjectId(),
            productId: new Types.ObjectId(input.productId),
            variantId: new Types.ObjectId(input.variantId),
            quantity: input.quantity,
            currentPrice: variant.price,
        });
    }

    await cart.save();

    return getCart(userId);
};

export const updateCartItem = async (
    userId: string,
    itemId: string,
    input: UpdateCartItemInput
): Promise<CartResponse> => {
    const cart = await CartModel.findOne({ userId });

    if (!cart) {
        throw new AppError("Cart item not found", 404);
    }

    const cartItem = findCartItem(cart, itemId);

    if (!cartItem) {
        throw new AppError("Cart item not found", 404);
    }

    const { variant } = await getSellableVariant(
        cartItem.productId.toString(),
        cartItem.variantId.toString()
    );

    if (input.quantity > variant.stock) {
        throw new AppError("Requested quantity exceeds available stock", 409);
    }

    cartItem.quantity = input.quantity;
    cartItem.currentPrice = variant.price;

    await cart.save();

    return getCart(userId);
};

export const removeCartItem = async (
    userId: string,
    itemId: string
): Promise<CartResponse> => {
    const cart = await CartModel.findOne({ userId });

    if (!cart) {
        throw new AppError("Cart item not found", 404);
    }

    const itemIndex = cart.items.findIndex(
        (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
        throw new AppError("Cart item not found", 404);
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return getCart(userId);
};

export const clearCart = async (userId: string): Promise<CartResponse> => {
    const cart = await getOrCreateCart(userId);

    cart.items = [];

    await cart.save();

    return getCart(userId);
};