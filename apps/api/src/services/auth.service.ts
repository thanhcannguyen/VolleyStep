
import { mongo, Types } from 'mongoose';

import { env } from "../config/env";
import { SessionModel } from "../models/session.model";
import {
    UserModel,
    type UserDocument,
} from "../models/user.model";
import type {
    RegisterInput,
    LoginInput,
    LogoutInput,
    RefreshTokenInput
} from "../schemas/auth.schema";
import { AppError } from "../utils/app-error";
import { hashPassword, verifyPassword } from "../utils/password";
import {
    getRefreshTokenExpiresAt,
    hashToken,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    type TokenPair,
} from "../utils/token";

export interface RegisterResult {
    user: UserDocument;
}

export interface LoginResult {
    user: UserDocument;
    tokens: TokenPair;
}

export interface RefreshResult {
    tokens: TokenPair;
}

const DUPLICATE_KEY_ERROR_CODE = 11000;

/**
 * 1. ĐĂNG KÝ TÀI KHOẢN (Giữ nguyên logic chuẩn của bạn)
 */
export const registerUser = async (
    input: RegisterInput,
): Promise<RegisterResult> => {
    const normalizedEmail = input.email
        .trim()
        .toLowerCase();

    const existingUser = await UserModel.exists({
        email: normalizedEmail,
    });

    if (existingUser) {
        throw new AppError(
            "Email is already registered",
            409,
        );
    }

    const passwordHash = await hashPassword(input.password);

    try {
        const user = await UserModel.create({
            fullName: input.fullName,
            email: normalizedEmail,
            passwordHash,
        });

        return { user };
    } catch (error: any) {
        if (
            error instanceof mongo.MongoServerError &&
            error.code === DUPLICATE_KEY_ERROR_CODE
        ) {
            throw new AppError(
                "Email is already registered",
                409,
            );
        }

        throw error;
    }
};

/**
 * 2. ĐĂNG NHẬP (Login)
 */
export const loginUser = async (
    input: LoginInput,
): Promise<LoginResult> => {
    const email = input.email.trim().toLowerCase();

    const user = await UserModel.findOne({
        email,
    }).select("+passwordHash");

    if (!user) {
        throw new AppError(
            "Email or password is incorrect",
            401,
        );
    }

    if (user.status !== "ACTIVE") {
        throw new AppError(
            "This account has been disabled",
            403,
        );
    }

    const passwordMatches = await verifyPassword(
        input.password,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw new AppError(
            "Email or password is incorrect",
            401,
        );
    }

    const sessionId = new Types.ObjectId();

    const accessToken = signAccessToken(
        user.id,
        user.role,
    );

    const refreshToken = signRefreshToken(
        user.id,
        sessionId.toString(),
    );

    await SessionModel.create({
        _id: sessionId,
        userId: user._id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: getRefreshTokenExpiresAt(),
    });

    return {
        user,
        tokens: {
            accessToken,
            refreshToken,
            accessTokenExpiresIn:
                env.ACCESS_TOKEN_TTL_SECONDS,
            refreshTokenExpiresIn:
                env.REFRESH_TOKEN_TTL_SECONDS,
        },
    };
};

/**
 * 3. LÀM MỚI TOKEN (Refresh Token Rotation)
 */
export const refreshAuthentication = async (
    input: RefreshTokenInput,
): Promise<RefreshResult> => {
    const payload = verifyRefreshToken(
        input.refreshToken,
    );

    const user = await UserModel.findById(payload.sub);

    if (!user || user.status !== "ACTIVE") {
        throw new AppError(
            "Refresh token is invalid or expired",
            401,
        );
    }

    const accessToken = signAccessToken(
        user.id,
        user.role,
    );

    const newRefreshToken = signRefreshToken(
        user.id,
        payload.sessionId,
    );

    const currentTokenHash = hashToken(
        input.refreshToken,
    );

    const newTokenHash = hashToken(
        newRefreshToken,
    );

    const refreshedSession =
        await SessionModel.findOneAndUpdate(
            {
                _id: payload.sessionId,
                userId: user._id,
                refreshTokenHash: currentTokenHash,
                revokedAt: null,
                expiresAt: {
                    $gt: new Date(),
                },
            },
            {
                $set: {
                    refreshTokenHash: newTokenHash,
                    expiresAt: getRefreshTokenExpiresAt(),
                },
            },
            {
                new: true,
            },
        );

    if (!refreshedSession) {
        throw new AppError(
            "Refresh token is invalid, expired, or already used",
            401,
        );
    }

    return {
        tokens: {
            accessToken,
            refreshToken: newRefreshToken,
            accessTokenExpiresIn:
                env.ACCESS_TOKEN_TTL_SECONDS,
            refreshTokenExpiresIn:
                env.REFRESH_TOKEN_TTL_SECONDS,
        },
    };
};

/**
 * 4. ĐĂNG XUẤT (Logout)
 */
export const logoutUser = async (
    input: LogoutInput,
): Promise<void> => {
    const payload = verifyRefreshToken(
        input.refreshToken,
    );

    const refreshTokenHash = hashToken(
        input.refreshToken,
    );

    await SessionModel.updateOne(
        {
            _id: payload.sessionId,
            userId: payload.sub,
            refreshTokenHash,
            revokedAt: null,
        },
        {
            $set: {
                revokedAt: new Date(),
            },
        },
    );
};