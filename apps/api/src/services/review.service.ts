
import { Types } from "mongoose";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import {
    ReviewModel,
    type ReviewDocument,
} from "../models/review.model";
import type {
    CreateReviewInput,
    ReviewListQuery,
} from "../schemas/review.schema";
import { AppError } from "../utils/app-error";
import { isDuplicateKeyError } from "../utils/duplicate-key";

export interface ReviewResponse {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
}

export interface ReviewListResult {
    reviews: ReviewResponse[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

const mapReviewResponse = (
    review: ReviewDocument,
): ReviewResponse => ({
    id: review._id.toString(),
    productId: review.productId.toString(),
    userId: review.userId.toString(),
    rating: review.rating,
    comment: review.comment ?? null,
    createdAt: review.createdAt,
});

const recalculateProductRating = async (
    productId: string,
): Promise<void> => {
    const [summary] = await ReviewModel.aggregate<{
        _id: null;
        averageRating: number;
        reviewCount: number;
    }>([
        {
            $match: {
                productId: new Types.ObjectId(productId),
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    await ProductModel.updateOne(
        { _id: productId },
        {
            $set: {
                ratingAverage: summary
                    ? Math.round(summary.averageRating * 10) / 10
                    : 0,
                ratingCount: summary
                    ? summary.reviewCount
                    : 0,
            },
        },
    );
};

export const createReview = async (
    userId: string,
    productId: string,
    input: CreateReviewInput,
): Promise<ReviewResponse> => {
    const product = await ProductModel.findById(
        productId,
    );
    if (!product || !product.isActive) {
        throw new AppError("Product not found", 404);
    }

    const deliveredOrder = await OrderModel.findOne({
        userId: new Types.ObjectId(userId),
        status: "DELIVERED",
        "items.productId": new Types.ObjectId(
            productId,
        ),
    });

    if (!deliveredOrder) {
        throw new AppError(
            "You can only review products you have received",
            403,
        );
    }

    try {
        const review = await ReviewModel.create({
            productId: new Types.ObjectId(productId),
            userId: new Types.ObjectId(userId),
            orderId: deliveredOrder._id,
            rating: input.rating,
            comment: input.comment,
        });

        await recalculateProductRating(productId);

        return mapReviewResponse(review);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new AppError(
                "You have already reviewed this product",
                409,
            );
        }
        throw error;
    }
};

export const listProductReviews = async (
    productId: string,
    query: ReviewListQuery,
): Promise<ReviewListResult> => {
    const page = Number(query.page ?? "1");
    const limit = Number(query.limit ?? "10");
    const skip = (page - 1) * limit;

    const filter = {
        productId: new Types.ObjectId(productId),
    };

    const [reviews, totalItems] = await Promise.all([
        ReviewModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        ReviewModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(
        totalItems / limit,
    );

    return {
        reviews: reviews.map(mapReviewResponse),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage:
                totalPages > 0 && page > 1,
        },
    };
};