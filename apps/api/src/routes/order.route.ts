
import { Router } from "express";
import { checkout } from "../controllers/order.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import { checkoutSchema } from "../schemas/order.schema";

export const orderRouter = Router();

orderRouter.post(
    "/checkout",
    authenticate,
    validate(checkoutSchema),
    checkout,
);