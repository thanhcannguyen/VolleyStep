
import type {
    ErrorRequestHandler,
    NextFunction,
    Request,
    Response,
} from "express";

import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import { ValidationError } from "./validate.middleware";

interface BodyParserError extends SyntaxError {
    status?: number;
    type?: string;
}

const isBodyParserError = (
    error: unknown,
): error is BodyParserError => {
    return (
        error instanceof SyntaxError &&
        "status" in error &&
        error.status === 400 &&
        "body" in error
    );
};

export const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
) => {
    if (isBodyParserError(error)) {
        response.status(400).json({
            success: false,
            message: "Invalid JSON body",
            ...(env.NODE_ENV === "development" && {
                stack: error.stack,
            }),
        });

        return;
    }

    if (error instanceof ValidationError) {
        response.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors,
            ...(env.NODE_ENV === "development" && {
                stack: error.stack,
            }),
        });

        return;
    }

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