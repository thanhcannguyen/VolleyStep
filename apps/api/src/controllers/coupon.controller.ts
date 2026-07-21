
import type {
    NextFunction,
    Request,
    Response,
} from "express";
import type {
    CreateCouponInput,
    UpdateCouponInput,
} from "../schemas/coupon.schema";
import {
    createCoupon,
    getCouponById,
    listCoupons,
    updateCoupon,
} from "../services/coupon.service";

export const createCouponHandler = async (
    request: Request<
        Record<string, never>,
        unknown,
        CreateCouponInput
    >,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const coupon = await createCoupon(request.body);

        response.status(201).json({
            success: true,
            message: "Coupon created successfully",
            data: { coupon },
        });
    } catch (error) {
        next(error);
    }
};

export const listCouponsHandler = async (
    _request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const coupons = await listCoupons();

        response.status(200).json({
            success: true,
            message: "Coupons retrieved successfully",
            data: { coupons },
        });
    } catch (error) {
        next(error);
    }
};

export const getCouponByIdHandler = async (
    request: Request<{ couponId: string }>,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const coupon = await getCouponById(
            request.params.couponId,
        );

        response.status(200).json({
            success: true,
            message: "Coupon retrieved successfully",
            data: { coupon },
        });
    } catch (error) {
        next(error);
    }
};

export const updateCouponHandler = async (
    request: Request<
        { couponId: string },
        unknown,
        UpdateCouponInput
    >,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const coupon = await updateCoupon(
            request.params.couponId,
            request.body,
        );

        response.status(200).json({
            success: true,
            message: "Coupon updated successfully",
            data: { coupon },
        });
    } catch (error) {
        next(error);
    }
};