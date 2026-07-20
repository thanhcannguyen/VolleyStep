
import { Router } from "express";

import {
    addProductVariantHandler,
    createProductHandler,
    deleteProductHandler,
    deleteProductVariantHandler,
    getAdminProductHandler,
    getProductBySlugHandler,
    listProductsHandler,
    updateProductHandler,
    updateProductVariantHandler,
} from "../controllers/product.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    createProductSchema,
    createProductVariantSchema,
    deleteProductVariantSchema,
    productIdParamSchema,
    productListQuerySchema,
    publicProductSlugSchema,
    updateProductSchema,
    updateProductVariantSchema,
} from "../schemas/product.schema";

// ==========================================
// PUBLIC PRODUCT ROUTER (BƯỚC 12)
// ==========================================

export const productRouter = Router();

productRouter.get(
    "/",
    validate(productListQuerySchema),
    listProductsHandler,
);

productRouter.get(
    "/:slug",
    validate(publicProductSlugSchema),
    getProductBySlugHandler,
);

// ==========================================
// ADMIN PRODUCT ROUTER
// ==========================================

export const adminProductRouter = Router();

adminProductRouter.use(authenticate, authorize("ADMIN"));

adminProductRouter.post(
    "/",
    validate(createProductSchema),
    createProductHandler,
);

adminProductRouter.get(
    "/:productId",
    validate(productIdParamSchema),
    getAdminProductHandler,
);

adminProductRouter.patch(
    "/:productId",
    validate(updateProductSchema),
    updateProductHandler,
);

adminProductRouter.delete(
    "/:productId",
    validate(productIdParamSchema),
    deleteProductHandler,
);

adminProductRouter.post(
    "/:productId/variants",
    validate(createProductVariantSchema),
    addProductVariantHandler,
);

adminProductRouter.patch(
    "/:productId/variants/:variantId",
    validate(updateProductVariantSchema),
    updateProductVariantHandler,
);

adminProductRouter.delete(
    "/:productId/variants/:variantId",
    validate(deleteProductVariantSchema),
    deleteProductVariantHandler,
);