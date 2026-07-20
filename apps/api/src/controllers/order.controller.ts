
import type { NextFunction, Request, Response } from "express";
import type { CheckoutInput } from "../schemas/order.schema";
import { checkoutCart } from "../services/order.service";
import { AppError } from "../utils/app-error";

export const checkout = async (
    request: Request<Record<string, never>, unknown, CheckoutInput>,
    response: Response,
    next: NextFunction,
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