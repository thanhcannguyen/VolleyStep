
import type { RequestHandler } from "express";

import type { RegisterInput } from "../schemas/auth.schema";
import { registerUser } from "../services/auth.service";

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