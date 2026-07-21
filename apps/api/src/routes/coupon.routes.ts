
import { Router } from "express";
import {
    createCouponHandler,
    getCouponByIdHandler,
    listCouponsHandler,
    updateCouponHandler,
} from "../controllers/coupon.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    couponIdParamSchema,
    createCouponSchema,
    updateCouponSchema,
} from "../schemas/coupon.schema";

export const adminCouponRouter = Router();

adminCouponRouter.use(
    authenticate,
    authorize("ADMIN"),
);

adminCouponRouter.post(
    "/",
    validate(createCouponSchema),
    createCouponHandler,
);

adminCouponRouter.get("/", listCouponsHandler);

adminCouponRouter.get(
    "/:couponId",
    validate(couponIdParamSchema),
    getCouponByIdHandler,
);

adminCouponRouter.patch(
    "/:couponId",
    validate(updateCouponSchema),
    updateCouponHandler,
);