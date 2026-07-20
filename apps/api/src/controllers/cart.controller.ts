
import type { RequestHandler } from "express";

import type {
    AddCartItemInput,
    UpdateCartItemInput,
} from "../schemas/cart.schema";
import {
    addCartItem,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem,
} from "../services/cart.service";
import { AppError } from "../utils/app-error";

type CartItemParams = {
    itemId: string;
} & Record<string, string>;

const getAuthenticatedUserId = (user: Express.Request["user"]): string => {
    if (!user) {
        throw new AppError("Authentication is required", 401);
    }

    return user.id;
};

export const getCartHandler: RequestHandler = async (request, response) => {
    const userId = getAuthenticatedUserId(request.user);

    const cart = await getCart(userId);

    response.status(200).json({
        success: true,
        message: "Cart retrieved successfully",
        data: {
            cart,
        },
    });
};

export const addCartItemHandler: RequestHandler<
    Record<string, string>,
    unknown,
    AddCartItemInput
> = async (request, response) => {
    const userId = getAuthenticatedUserId(request.user);

    const cart = await addCartItem(userId, request.body);

    response.status(201).json({
        success: true,
        message: "Cart item added successfully",
        data: {
            cart,
        },
    });
};

export const updateCartItemHandler: RequestHandler<
    CartItemParams,
    unknown,
    UpdateCartItemInput
> = async (request, response) => {
    const userId = getAuthenticatedUserId(request.user);

    const cart = await updateCartItem(
        userId,
        request.params.itemId,
        request.body,
    );

    response.status(200).json({
        success: true,
        message: "Cart item updated successfully",
        data: {
            cart,
        },
    });
};

export const removeCartItemHandler: RequestHandler<CartItemParams> = async (
    request,
    response,
) => {
    const userId = getAuthenticatedUserId(request.user);

    const cart = await removeCartItem(userId, request.params.itemId);

    response.status(200).json({
        success: true,
        message: "Cart item removed successfully",
        data: {
            cart,
        },
    });
};

export const clearCartHandler: RequestHandler = async (
    request,
    response,
) => {
    const userId = getAuthenticatedUserId(request.user);

    const cart = await clearCart(userId);

    response.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        data: {
            cart,
        },
    });
};