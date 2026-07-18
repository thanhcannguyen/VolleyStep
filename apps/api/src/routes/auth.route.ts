
import { Router } from "express";

import { register } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema } from "../schemas/auth.schema";

export const authRouter = Router();

authRouter.post(
    "/register",
    validate(registerSchema),
    register,
);