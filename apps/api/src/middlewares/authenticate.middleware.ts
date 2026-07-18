
import type { RequestHandler } from "express";

import { AppError } from "../utils/app-error";
import { verifyAccessToken } from "../utils/token";

export const authenticate: RequestHandler = (
    request,
    _response,
    next,
) => {
    const authorizationHeader =
        request.headers.authorization;

    if (!authorizationHeader) {
        next(
            new AppError(
                "Authentication is required",
                401,
            ),
        );

        return;
    }

    const [scheme, token] =
        authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        next(
            new AppError(
                "Authorization header must use Bearer token",
                401,
            ),
        );

        return;
    }

    const payload = verifyAccessToken(token);

    request.user = {
        id: payload.sub,
        role: payload.role,
    };

    next();
};