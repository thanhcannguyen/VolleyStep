
import type { RequestHandler } from "express";

import type {
    CreateBrandInput,
    UpdateBrandInput,
} from "../schemas/catalog.schema";
import {
    createBrand,
    deactivateBrand,
    getActiveBrands,
    getAllBrands,
    updateBrand,
} from "../services/brand.service";

interface BrandParams {
    brandId: string;
}

const mapBrandResponse = (brand: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}) => {
    return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
    };
};

export const listPublicBrands: RequestHandler =
    async (_request, response) => {
        const brands = await getActiveBrands();

        response.status(200).json({
            success: true,
            message: "Brands retrieved successfully",
            data: {
                brands: brands.map(mapBrandResponse),
            },
        });
    };

export const listAdminBrands: RequestHandler =
    async (_request, response) => {
        const brands = await getAllBrands();

        response.status(200).json({
            success: true,
            message: "Brands retrieved successfully",
            data: {
                brands: brands.map(mapBrandResponse),
            },
        });
    };

export const createBrandHandler: RequestHandler<
    Record<string, never>,
    unknown,
    CreateBrandInput
> = async (request, response) => {
    const brand = await createBrand(
        request.body,
    );

    response.status(201).json({
        success: true,
        message: "Brand created successfully",
        data: {
            brand: mapBrandResponse(brand),
        },
    });
};

export const updateBrandHandler: RequestHandler<
    BrandParams,
    unknown,
    UpdateBrandInput
> = async (request, response) => {
    const brand = await updateBrand(
        request.params.brandId,
        request.body,
    );

    response.status(200).json({
        success: true,
        message: "Brand updated successfully",
        data: {
            brand: mapBrandResponse(brand),
        },
    });
};

export const deleteBrandHandler: RequestHandler<
    BrandParams
> = async (request, response) => {
    const brand = await deactivateBrand(
        request.params.brandId,
    );

    response.status(200).json({
        success: true,
        message: "Brand deactivated successfully",
        data: {
            brand: mapBrandResponse(brand),
        },
    });
};