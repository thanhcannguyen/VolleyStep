
import { Router } from "express";

import {
    getCurrentUser,
    login,
    logout,
    refresh,
    register,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    loginSchema,
    logoutSchema,
    refreshTokenSchema,
    registerSchema,
} from "../schemas/auth.schema";

export const authRouter = Router();

authRouter.post(
    "/register",
    validate(registerSchema),
    register,
);

authRouter.post(
    "/login",
    validate(loginSchema),
    login,
);

authRouter.post(
    "/refresh",
    validate(refreshTokenSchema),
    refresh,
);

authRouter.post(
    "/logout",
    validate(logoutSchema),
    logout,
);

authRouter.get(
    "/me",
    authenticate,
    getCurrentUser,
);