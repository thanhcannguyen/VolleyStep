
import { Types, startSession, type ClientSession } from "mongoose";
import { BrandModel } from "../models/brand.model";
import { CartModel } from "../models/cart.model";
import { CategoryModel } from "../models/category.model";
import {
    OrderModel,
    type OrderDocument,
    type OrderItemSnapshot,
} from "../models/order.model";
import {
    ProductModel,
    type Product,
    type ProductVariant,
} from "../models/product.model";
import type { CheckoutInput } from "../schemas/order.schema";
import { AppError } from "../utils/app-error";
import { isDuplicateKeyError } from "../utils/duplicate-key";

interface ProductWithVariant {
    product: Product & { _id: Types.ObjectId };
    variant: ProductVariant;
}

export interface CheckoutOrderResponse {
    id: string;
    orderNumber: string;
    status: string;
    items: Array<{
        id: string;
        productId: string;
        variantId: string;
        productName: string;
        productSlug: string;
        sku: string;
        color: string;
        size: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        image: string | null;
    }>;
    shippingAddress: {
        recipientName: string;
        phone: string;
        addressLine: string;
        ward?: string;
        district: string;
        province: string;
        postalCode?: string;
    };
    subtotal: number;
    shippingFee: number;
    total: number;
    createdAt: Date;
}

const generateOrderNumber = (): string => {
    const date = new Date();
    const datePart = [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
    ].join("");

    const randomPart = new Types.ObjectId()
        .toHexString()
        .slice(-6)
        .toUpperCase();

    return `VS-${datePart}-${randomPart}`;
};

const mapOrderResponse = (order: OrderDocument): CheckoutOrderResponse => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    items: order.items.map((item) => ({
        id: item._id.toString(),
        productId: item.productId.toString(),
        variantId: item.variantId.toString(),
        productName: item.productName,
        productSlug: item.productSlug,
        sku: item.sku,
        color: item.color,
        size: item.size,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        image: item.image,
    })),
    shippingAddress: {
        recipientName: order.shippingAddress.recipientName,
        phone: order.shippingAddress.phone,
        addressLine: order.shippingAddress.addressLine,
        ...(order.shippingAddress.ward
            ? { ward: order.shippingAddress.ward }
            : {}),
        district: order.shippingAddress.district,
        province: order.shippingAddress.province,
        ...(order.shippingAddress.postalCode
            ? {
                postalCode: order.shippingAddress.postalCode,
            }
            : {}),
    },
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    createdAt: order.createdAt,
});

const assertCatalogReferencesAreActive = async (
    products: Array<Product & { _id: Types.ObjectId }>,
    session: ClientSession,
): Promise<void> => {
    const brandIds = [
        ...new Set(products.map((product) => product.brandId.toString())),
    ].map((id) => new Types.ObjectId(id));

    const categoryIds = [
        ...new Set(products.map((product) => product.categoryId.toString())),
    ].map((id) => new Types.ObjectId(id));

    const [activeBrandCount, activeCategoryCount] = await Promise.all([
        BrandModel.countDocuments({
            _id: { $in: brandIds },
            isActive: true,
        }).session(session),
        CategoryModel.countDocuments({
            _id: { $in: categoryIds },
            isActive: true,
        }).session(session),
    ]);

    if (activeBrandCount !== brandIds.length) {
        throw new AppError("One or more product brands are unavailable", 400);
    }

    if (activeCategoryCount !== categoryIds.length) {
        throw new AppError("One or more product categories are unavailable", 400);
    }
};

const buildOrderItems = (
    cartItems: Array<{
        productId: Types.ObjectId;
        variantId: Types.ObjectId;
        quantity: number;
    }>,
    products: Array<Product & { _id: Types.ObjectId }>,
): {
    snapshots: OrderItemSnapshot[];
    productVariants: ProductWithVariant[];
} => {
    const productMap = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    const snapshots: OrderItemSnapshot[] = [];
    const productVariants: ProductWithVariant[] = [];

    for (const cartItem of cartItems) {
        const product = productMap.get(cartItem.productId.toString());

        if (!product || !product.isActive) {
            throw new AppError("One or more cart products are unavailable", 400);
        }

        const variant = product.variants.find((candidate) =>
            candidate._id.equals(cartItem.variantId),
        );

        if (!variant) {
            throw new AppError("One or more cart variants are unavailable", 400);
        }

        if (variant.stock < cartItem.quantity) {
            throw new AppError(
                `Insufficient stock for SKU ${variant.sku}`,
                409,
            );
        }

        const lineTotal = variant.price * cartItem.quantity;

        snapshots.push({
            _id: new Types.ObjectId(),
            productId: product._id,
            variantId: variant._id,
            productName: product.name,
            productSlug: product.slug,
            sku: variant.sku,
            color: variant.color,
            size: variant.size,
            unitPrice: variant.price,
            quantity: cartItem.quantity,
            lineTotal,
            image: variant.images[0] ?? null,
        });

        productVariants.push({ product, variant });
    }

    return { snapshots, productVariants };
};

const decrementStockAtomically = async (
    items: OrderItemSnapshot[],
    session: ClientSession,
): Promise<void> => {
    for (const item of items) {
        const result = await ProductModel.updateOne(
            {
                _id: item.productId,
                isActive: true,
                variants: {
                    $elemMatch: {
                        _id: item.variantId,
                        stock: { $gte: item.quantity },
                    },
                },
            },
            {
                $inc: {
                    "variants.$[variant].stock": -item.quantity,
                },
            },
            {
                arrayFilters: [
                    {
                        "variant._id": item.variantId,
                        "variant.stock": {
                            $gte: item.quantity,
                        },
                    },
                ],
                session,
            },
        );

        if (result.modifiedCount !== 1) {
            throw new AppError(
                `Stock changed during checkout for SKU ${item.sku}`,
                409,
            );
        }
    }
};

export const checkoutCart = async (
    userId: string,
    input: CheckoutInput,
): Promise<CheckoutOrderResponse> => {
    const session = await startSession();

    try {
        let createdOrder: OrderDocument | null = null;

        await session.withTransaction(async () => {
            const cart = await CartModel.findOne({
                userId,
            }).session(session);

            if (!cart || cart.items.length === 0) {
                throw new AppError("Cart is empty", 400);
            }

            const productIds = [
                ...new Set(cart.items.map((item) => item.productId.toString())),
            ].map((id) => new Types.ObjectId(id));

            const products = await ProductModel.find({
                _id: { $in: productIds },
            })
                .session(session)
                .lean();

            if (products.length !== productIds.length) {
                throw new AppError(
                    "One or more cart products no longer exist",
                    400,
                );
            }

            await assertCatalogReferencesAreActive(products, session);

            const { snapshots } = buildOrderItems(cart.items, products);

            const subtotal = snapshots.reduce(
                (sum, item) => sum + item.lineTotal,
                0,
            );
            const shippingFee = 0;
            const total = subtotal + shippingFee;

            await decrementStockAtomically(snapshots, session);

            const [order] = await OrderModel.create(
                [
                    {
                        orderNumber: generateOrderNumber(),
                        userId: new Types.ObjectId(userId),
                        items: snapshots,
                        shippingAddress: input.shippingAddress,
                        subtotal,
                        shippingFee,
                        total,
                        status: "PENDING",
                    },
                ],
                { session },
            );

            if (!order) {
                throw new AppError("Unable to create order", 500);
            }

            const deleteResult = await CartModel.deleteOne(
                {
                    _id: cart._id,
                    userId: cart.userId,
                },
                { session },
            );

            if (deleteResult.deletedCount !== 1) {
                throw new AppError("Unable to clear cart after checkout", 409);
            }

            createdOrder = order;
        });

        if (!createdOrder) {
            throw new AppError(
                "Checkout transaction did not create an order",
                500,
            );
        }

        return mapOrderResponse(createdOrder);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new AppError("Unable to generate a unique order number", 409);
        }

        throw error;
    } finally {
        await session.endSession();
    }
};