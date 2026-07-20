
import express from "express";

import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { authRouter } from "./routes/auth.route";
import { adminBrandRouter, brandRouter } from "./routes/brand.route";
import { cartRouter } from "./routes/cart.route";
import { adminCategoryRouter, categoryRouter } from "./routes/category.route";
import { orderRouter } from "./routes/order.route";
import {
    adminProductRouter,
    productRouter,
} from "./routes/product.route";

export const app = express();

app.use(express.json());

app.get("/api/health", (_request, response) => {
    response.status(200).json({
        success: true,
        message: "VolleyStep API is running",
    });
});

app.use("/api/auth", authRouter);

app.use("/api/brands", brandRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);

app.use("/api/admin/brands", adminBrandRouter);
app.use("/api/admin/categories", adminCategoryRouter);
app.use("/api/admin/products", adminProductRouter);

app.use(notFoundHandler);
app.use(errorHandler);