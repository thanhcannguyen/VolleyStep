
import crypto from "node:crypto";

import jwt from "jsonwebtoken";

import { env } from "../config/env";
import type {
    AccessTokenPayload,
    RefreshTokenPayload,
} from "../types/auth.types";
import type { UserRole } from "../models/user.model";
import { AppError } from "./app-error";

const JWT_ALGORITHM = "HS256";

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
}

export const signAccessToken = (
    userId: string,
    role: UserRole,
): string => {
    const payload: AccessTokenPayload = {
        sub: userId,
        role,
        type: "access",
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        algorithm: JWT_ALGORITHM,
        expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    });
};

export const signRefreshToken = (
    userId: string,
    sessionId: string,
): string => {
    const payload: RefreshTokenPayload = {
        sub: userId,
        sessionId,
        type: "refresh",
    };

    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        algorithm: JWT_ALGORITHM,
        expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
    });
};

export const verifyAccessToken = (
    token: string,
): AccessTokenPayload => {
    try {
        const payload = jwt.verify(
            token,
            env.JWT_ACCESS_SECRET,
            {
                algorithms: [JWT_ALGORITHM],
            },
        );

        if (
            typeof payload === "string" ||
            payload.type !== "access" ||
            typeof payload.sub !== "string" ||
            typeof payload.role !== "string"
        ) {
            throw new AppError("Invalid access token", 401);
        }

        return payload as unknown as AccessTokenPayload;
    } catch (error: unknown) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Access token is invalid or expired",
            401,
        );
    }
};

export const verifyRefreshToken = (
    token: string,
): RefreshTokenPayload => {
    try {
        const payload = jwt.verify(
            token,
            env.JWT_REFRESH_SECRET,
            {
                algorithms: [JWT_ALGORITHM],
            },
        );

        if (
            typeof payload === "string" ||
            payload.type !== "refresh" ||
            typeof payload.sub !== "string" ||
            typeof payload.sessionId !== "string"
        ) {
            throw new AppError("Invalid refresh token", 401);
        }

        return payload as unknown as RefreshTokenPayload;
    } catch (error: unknown) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Refresh token is invalid or expired",
            401,
        );
    }
};

export const hashToken = (token: string): string => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

export const getRefreshTokenExpiresAt = (): Date => {
    return new Date(
        Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000,
    );
};