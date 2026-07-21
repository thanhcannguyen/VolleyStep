
import type {
    NextFunction,
    Request,
    Response,
} from "express";
import type {
    CreateReviewInput,
    ReviewListQuery,
} from "../schemas/review.schema";
import {
    createReview,
    listProductReviews,
} from "../services/review.service";
import { AppError } from "../utils/app-error";

export const createReviewHandler = async (
    request: Request<
        { productId: string },
        unknown,
        CreateReviewInput
    >,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!request.user) {
            throw new AppError(
                "Authentication is required",
                401,
            );
        }

        const review = await createReview(
            request.user.id,
            request.params.productId,
            request.body,
        );

        response.status(201).json({
            success: true,
            message: "Review created successfully",
            data: { review },
        });
    } catch (error) {
        next(error);
    }
};

export const listProductReviewsHandler = async (
    request: Request<
        { productId: string },
        unknown,
        unknown,
        ReviewListQuery
    >,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const result = await listProductReviews(
            request.params.productId,
            request.query,
        );

        response.status(200).json({
            success: true,
            message: "Reviews retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};