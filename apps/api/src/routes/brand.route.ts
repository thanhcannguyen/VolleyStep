
import { Router } from "express";

import {
    createBrandHandler,
    deleteBrandHandler,
    listAdminBrands,
    listPublicBrands,
    updateBrandHandler,
} from "../controllers/brand.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    brandIdParamSchema,
    createBrandSchema,
    updateBrandSchema,
} from "../schemas/catalog.schema";

export const brandRouter = Router();

export const adminBrandRouter = Router();

brandRouter.get(
    "/",
    listPublicBrands,
);

adminBrandRouter.use(
    authenticate,
    authorize("ADMIN"),
);

adminBrandRouter.get(
    "/",
    listAdminBrands,
);

adminBrandRouter.post(
    "/",
    validate(createBrandSchema),
    createBrandHandler,
);

adminBrandRouter.patch(
    "/:brandId",
    validate(updateBrandSchema),
    updateBrandHandler as any,
);

adminBrandRouter.delete(
    "/:brandId",
    validate(brandIdParamSchema),
    deleteBrandHandler as any,
);