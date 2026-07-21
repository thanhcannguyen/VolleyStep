
import { Router } from "express";
import {
    createReviewHandler,
    listProductReviewsHandler,
} from "../controllers/review.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    createReviewSchema,
    reviewListQuerySchema,
} from "../schemas/review.schema";

export const reviewRouter = Router({
    mergeParams: true,
});

reviewRouter.post(
    "/",
    authenticate,
    validate(createReviewSchema),
    createReviewHandler,
);

reviewRouter.get(
    "/",
    validate(reviewListQuerySchema),
    listProductReviewsHandler,
);