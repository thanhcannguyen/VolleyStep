
import { Router } from "express";

import {
    addCartItemHandler,
    clearCartHandler,
    getCartHandler,
    removeCartItemHandler,
    updateCartItemHandler,
} from "../controllers/cart.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    addCartItemSchema,
    cartItemIdParamSchema,
    updateCartItemSchema,
} from "../schemas/cart.schema";

export const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get("/", getCartHandler);

cartRouter.post("/items", validate(addCartItemSchema), addCartItemHandler);

cartRouter.patch(
    "/items/:itemId",
    validate(updateCartItemSchema),
    updateCartItemHandler
);

cartRouter.delete(
    "/items/:itemId",
    validate(cartItemIdParamSchema),
    removeCartItemHandler
);

cartRouter.delete("/", clearCartHandler);