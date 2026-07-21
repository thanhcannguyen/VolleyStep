
import express from "express";

import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { authRouter } from "./routes/auth.route";
import { adminBrandRouter, brandRouter } from "./routes/brand.route";
import { cartRouter } from "./routes/cart.route";
import { adminCategoryRouter, categoryRouter } from "./routes/category.route";
import { adminOrderRouter, orderRouter } from "./routes/order.route";
import {
    adminProductRouter,
    productRouter,
} from "./routes/product.route";

import { adminCouponRouter } from "./routes/coupon.routes";

export const app = express();

app.use(express.json());

app.get("/api/health", (_request, response) => {
    response.status(200).json({
        success: true,
        message: "VolleyStep API is running",
    });
});

// Authentication Routes
app.use("/api/auth", authRouter);

// Customer Routes
app.use("/api/brands", brandRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);

// Admin Routes
app.use("/api/admin/brands", adminBrandRouter);
app.use("/api/admin/categories", adminCategoryRouter);
app.use("/api/admin/products", adminProductRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/coupons", adminCouponRouter);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);