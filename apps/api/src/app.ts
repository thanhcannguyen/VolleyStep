
import express from "express";
import cors from "cors";
import { env } from "./config/env";

import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { authRouter } from "./routes/auth.route";
import { adminBrandRouter, brandRouter } from "./routes/brand.route";
import { cartRouter } from "./routes/cart.route";
import { adminCategoryRouter, categoryRouter } from "./routes/category.route";
import { adminOrderRouter, orderRouter } from "./routes/order.route";
import { adminProductRouter, productRouter } from "./routes/product.route";
import { adminCouponRouter } from "./routes/coupon.routes";
import { reviewRouter } from "./routes/review.route";

export const app = express();

app.use(
    cors({
        origin: env.WEB_URL,
        credentials: true,
    }),
);

app.use(express.json());

// Endpoint kiểm tra trạng thái API
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
app.use("/api/products/:productId/reviews", reviewRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);

// Admin Routes
app.use("/api/admin/brands", adminBrandRouter);
app.use("/api/admin/categories", adminCategoryRouter);
app.use("/api/admin/products", adminProductRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/coupons", adminCouponRouter);

// Error Handling Middlewares (luôn đặt ở cuối)
app.use(notFoundHandler);
app.use(errorHandler);