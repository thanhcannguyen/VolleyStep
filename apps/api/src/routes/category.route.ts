
import { Router } from "express";

import {
    createCategoryHandler,
    deleteCategoryHandler,
    listAdminCategories,
    listPublicCategories,
    updateCategoryHandler,
} from "../controllers/category.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    categoryIdParamSchema,
    createCategorySchema,
    updateCategorySchema,
} from "../schemas/catalog.schema";

export const categoryRouter = Router();

export const adminCategoryRouter = Router();

categoryRouter.get(
    "/",
    listPublicCategories,
);

adminCategoryRouter.use(
    authenticate,
    authorize("ADMIN"),
);

adminCategoryRouter.get(
    "/",
    listAdminCategories,
);

adminCategoryRouter.post(
    "/",
    validate(createCategorySchema),
    createCategoryHandler,
);

adminCategoryRouter.patch(
    "/:categoryId",
    validate(updateCategorySchema),
    updateCategoryHandler as any,
);

adminCategoryRouter.delete(
    "/:categoryId",
    validate(categoryIdParamSchema),
    deleteCategoryHandler as any,
);