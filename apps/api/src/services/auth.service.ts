
import { mongo } from 'mongoose';

import {
    UserModel,
    type UserDocument,
} from "../models/user.model";
import type { RegisterInput } from "../schemas/auth.schema";
import { AppError } from "../utils/app-error";
import { hashPassword } from "../utils/password";

export interface RegisterResult {
    user: UserDocument;
}

const DUPLICATE_KEY_ERROR_CODE = 11000;

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