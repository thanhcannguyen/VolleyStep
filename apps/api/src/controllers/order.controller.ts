
import type { NextFunction, Request, Response } from "express";
import type {
    AdminOrderListQuery,
    CheckoutInput,
    OrderListQuery,
    UpdateOrderStatusInput,
} from "../schemas/order.schema";
import {
    checkoutCart,
    getAdminOrderById,
    getCustomerOrderById,
    listAdminOrders,
    listCustomerOrders,
    updateOrderStatus,
} from "../services/order.service";
import { AppError } from "../utils/app-error";

// ==========================================
// CUSTOMER ORDER CONTROLLERS
// ==========================================

export const checkout = async (
    request: Request<Record<string, never>, unknown, CheckoutInput>,
    response: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!request.user) {
            throw new AppError("Authentication is required", 401);
        }

        const order = await checkoutCart(request.user.id, request.body);

        response.status(201).json({
            success: true,
            message: "Checkout completed successfully",
            data: { order },
        });
    } catch (error) {
        next(error);
    }
};

export const listMyOrders = async (
    request: Request<Record<string, never>, unknown, unknown, OrderListQuery>,
    response: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!request.user) {
            throw new AppError("Authentication is required", 401);
        }

        const result = await listCustomerOrders(
            request.user.id,
            request.query
        );

        response.status(200).json({
            success: true,
            message: "Orders retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getMyOrderById = async (
    request: Request<{ orderId: string }>,
    response: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!request.user) {
            throw new AppError("Authentication is required", 401);
        }

        const order = await getCustomerOrderById(
            request.user.id,
            request.params.orderId
        );

        response.status(200).json({
            success: true,
            message: "Order retrieved successfully",
            data: { order },
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// ADMIN ORDER CONTROLLERS
// ==========================================

export const listOrdersForAdmin = async (
    request: Request<Record<string, never>, unknown, unknown, AdminOrderListQuery>,
    response: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await listAdminOrders(request.query);

        response.status(200).json({
            success: true,
            message: "Orders retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderByIdForAdmin = async (
    request: Request<{ orderId: string }>,
    response: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const order = await getAdminOrderById(request.params.orderId);

        response.status(200).json({
            success: true,
            message: "Order retrieved successfully",
            data: { order },
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatusForAdmin = async (
    request: Request<
        { orderId: string },
        unknown,
        UpdateOrderStatusInput["body"]
    >,
    response: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const order = await updateOrderStatus(
            request.params.orderId,
            request.body.status
        );

        response.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: { order },
        });
    } catch (error) {
        next(error);
    }
};