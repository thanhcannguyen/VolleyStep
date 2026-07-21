
import type { ClientSession } from "mongoose";
import {
    CouponModel,
    type CouponDocument,
} from "../models/coupon.model";
import type {
    CreateCouponInput,
    UpdateCouponInput,
} from "../schemas/coupon.schema";
import { AppError } from "../utils/app-error";
import { isDuplicateKeyError } from "../utils/duplicate-key";

export interface CouponResponse {
    id: string;
    code: string;
    type: string;
    value: number;
    minOrderAmount: number;
    maxUsageCount: number;
    usageCount: number;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
}

const mapCouponResponse = (
    coupon: CouponDocument,
): CouponResponse => ({
    id: coupon._id.toString(),
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount,
    maxUsageCount: coupon.maxUsageCount,
    usageCount: coupon.usageCount,
    expiresAt: coupon.expiresAt,
    isActive: coupon.isActive,
    createdAt: coupon.createdAt,
});

export const createCoupon = async (
    input: CreateCouponInput,
): Promise<CouponResponse> => {
    try {
        const coupon = await CouponModel.create({
            code: input.code,
            type: input.type,
            value: input.value,
            minOrderAmount: input.minOrderAmount,
            maxUsageCount: input.maxUsageCount,
            expiresAt: input.expiresAt,
        });

        return mapCouponResponse(coupon);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new AppError(
                "Coupon code already exists",
                409,
            );
        }
        throw error;
    }
};

export const listCoupons = async (): Promise<
    CouponResponse[]
> => {
    const coupons = await CouponModel.find().sort({
        createdAt: -1,
    });

    return coupons.map(mapCouponResponse);
};

export const getCouponById = async (
    couponId: string,
): Promise<CouponResponse> => {
    const coupon = await CouponModel.findById(couponId);

    if (!coupon) {
        throw new AppError("Coupon not found", 404);
    }

    return mapCouponResponse(coupon);
};

export const updateCoupon = async (
    couponId: string,
    input: UpdateCouponInput,
): Promise<CouponResponse> => {
    const coupon = await CouponModel.findByIdAndUpdate(
        couponId,
        { $set: input },
        { new: true, runValidators: true },
    );

    if (!coupon) {
        throw new AppError("Coupon not found", 404);
    }

    return mapCouponResponse(coupon);
};

const calculateDiscount = (
    coupon: CouponDocument,
    subtotal: number,
): number => {
    if (coupon.type === "PERCENTAGE") {
        return Math.floor(
            (subtotal * coupon.value) / 100,
        );
    }

    return Math.min(coupon.value, subtotal);
};

export const applyCouponInTransaction = async (
    code: string,
    subtotal: number,
    session: ClientSession,
): Promise<{
    couponId: string;
    code: string;
    discountAmount: number;
}> => {
    const coupon = await CouponModel.findOne({
        code: code.trim().toUpperCase(),
    }).session(session);

    if (!coupon || !coupon.isActive) {
        throw new AppError("Coupon is invalid", 400);
    }

    if (coupon.expiresAt.getTime() < Date.now()) {
        throw new AppError("Coupon has expired", 400);
    }

    if (subtotal < coupon.minOrderAmount) {
        throw new AppError(
            `Order must be at least ${coupon.minOrderAmount} to use this coupon`,
            400,
        );
    }

    const result = await CouponModel.updateOne(
        {
            _id: coupon._id,
            usageCount: { $lt: coupon.maxUsageCount },
        },
        { $inc: { usageCount: 1 } },
        { session },
    );

    if (result.modifiedCount !== 1) {
        throw new AppError(
            "Coupon usage limit reached",
            409,
        );
    }

    return {
        couponId: coupon._id.toString(),
        code: coupon.code,
        discountAmount: calculateDiscount(
            coupon,
            subtotal,
        ),
    };
};