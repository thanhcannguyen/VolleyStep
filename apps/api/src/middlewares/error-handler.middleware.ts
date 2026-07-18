
import type {
    ErrorRequestHandler,
    NextFunction,
    Request,
    Response,
} from "express";

import { env } from "../config/env";
import { AppError } from "../utils/app-error";

export const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
) => {
    if (error instanceof AppError) {
        response.status(error.statusCode).json({
            success: false,
            message: error.message,
            ...(env.NODE_ENV === "development" && {
                stack: error.stack,
            }),
        });

        return;
    }

    console.error("Unexpected error:", error);

    response.status(500).json({
        success: false,
        message: "Internal server error",
        ...(env.NODE_ENV === "development" &&
            error instanceof Error && {
            stack: error.stack,
        }),
    });
};