
import { Router } from "express";
import {
    checkout,
    getMyOrderById,
    getOrderByIdForAdmin,
    listMyOrders,
    listOrdersForAdmin,
    updateOrderStatusForAdmin,
} from "../controllers/order.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    adminOrderListQuerySchema,
    checkoutSchema,
    orderIdParamSchema,
    orderListQuerySchema,
    updateOrderStatusSchema,
} from "../schemas/order.schema";

// ==========================================
// CUSTOMER ORDER ROUTER
// ==========================================
export const orderRouter = Router();

// Toàn bộ các route trong orderRouter đều yêu cầu đăng nhập
orderRouter.use(authenticate);

orderRouter.post(
    "/checkout",
    validate(checkoutSchema),
    checkout
);

orderRouter.get(
    "/",
    validate(orderListQuerySchema),
    listMyOrders
);

orderRouter.get(
    "/:orderId",
    validate(orderIdParamSchema),
    getMyOrderById
);

// ==========================================
// ADMIN ORDER ROUTER
// ==========================================
export const adminOrderRouter = Router();

// Yêu cầu đăng nhập và bắt buộc phải có role ADMIN
adminOrderRouter.use(authenticate, authorize("ADMIN"));

adminOrderRouter.get(
    "/",
    validate(adminOrderListQuerySchema),
    listOrdersForAdmin
);

adminOrderRouter.get(
    "/:orderId",
    validate(orderIdParamSchema),
    getOrderByIdForAdmin
);

adminOrderRouter.patch(
    "/:orderId/status",
    validate(updateOrderStatusSchema),
    updateOrderStatusForAdmin
);