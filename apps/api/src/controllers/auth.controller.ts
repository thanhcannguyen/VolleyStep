
import type { RequestHandler } from "express";

import { UserModel } from "../models/user.model";
import type {
    RegisterInput,
    LoginInput,
    LogoutInput,
    RefreshTokenInput,
} from "../schemas/auth.schema";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAuthentication,
} from "../services/auth.service";
import { AppError } from "../utils/app-error";

/**
 * 1. ĐĂNG KÝ (Register Controller - Giữ nguyên logic của bạn)
 */
export const register: RequestHandler<
    Record<string, never>,
    unknown,
    RegisterInput
> = async (request, response) => {
    const { user } = await registerUser(request.body);

    response.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
            },
        },
    });
};

/**
 * 2. ĐĂNG NHẬP (Login Controller)
 */
export const login: RequestHandler<
    Record<string, never>,
    unknown,
    LoginInput
> = async (request, response) => {
    const { user, tokens } = await loginUser(
        request.body,
    );

    response.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
            },
            tokens,
        },
    });
};

/**
 * 3. LÀM MỚI TOKEN (Refresh Controller)
 */
export const refresh: RequestHandler<
    Record<string, never>,
    unknown,
    RefreshTokenInput
> = async (request, response) => {
    const { tokens } = await refreshAuthentication(
        request.body,
    );

    response.status(200).json({
        success: true,
        message: "Tokens refreshed successfully",
        data: {
            tokens,
        },
    });
};

/**
 * 4. ĐĂNG XUẤT (Logout Controller)
 */
export const logout: RequestHandler<
    Record<string, never>,
    unknown,
    LogoutInput
> = async (request, response) => {
    await logoutUser(request.body);

    response.status(200).json({
        success: true,
        message: "Logout successful",
    });
};

/**
 * 5. LẤY THÔNG TIN USER HIỆN TẠI (Current User Controller)
 */
export const getCurrentUser: RequestHandler =
    async (request, response) => {
        if (!request.user) {
            throw new AppError(
                "Authentication is required",
                401,
            );
        }

        const user = await UserModel.findById(
            request.user.id,
        );

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.status !== "ACTIVE") {
            throw new AppError(
                "This account has been disabled",
                403,
            );
        }

        response.status(200).json({
            success: true,
            message: "Current user retrieved successfully",
            data: {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt,
                },
            },
        });
    };