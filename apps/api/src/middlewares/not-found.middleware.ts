
import type { RequestHandler } from "express";

import { AppError } from "../utils/app-error";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
    next(
        new AppError(
            `Cannot ${request.method} ${request.originalUrl}`,
            404,
        ),
    );
};