
import type { RequestHandler } from "express";

import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { verifyAccessToken } from "../utils/token";

export const authenticate: RequestHandler =
    async (request, _response, next) => {
        const authorizationHeader =
            request.headers.authorization;

        if (!authorizationHeader) {
            throw new AppError(
                "Authentication is required",
                401,
            );
        }

        const [scheme, token] =
            authorizationHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            throw new AppError(
                "Authorization header must use Bearer token",
                401,
            );
        }

        const payload = verifyAccessToken(token);

        const user = await UserModel.findById(
            payload.sub,
        ).select("role status");

        if (!user) {
            throw new AppError(
                "Authentication is invalid",
                401,
            );
        }

        if (user.status !== "ACTIVE") {
            throw new AppError(
                "This account has been disabled",
                403,
            );
        }

        request.user = {
            id: user.id,
            role: user.role,
        };

        next();
    };