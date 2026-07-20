
import type { RequestHandler } from "express";

import type {
    CreateCategoryInput,
    UpdateCategoryInput,
} from "../schemas/catalog.schema";
import {
    createCategory,
    deactivateCategory,
    getActiveCategories,
    getAllCategories,
    updateCategory,
} from "../services/category.service";

interface CategoryParams {
    categoryId: string;
}

const mapCategoryResponse = (category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}) => {
    return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
    };
};

export const listPublicCategories: RequestHandler =
    async (_request, response) => {
        const categories =
            await getActiveCategories();

        response.status(200).json({
            success: true,
            message:
                "Categories retrieved successfully",
            data: {
                categories: categories.map(
                    mapCategoryResponse,
                ),
            },
        });
    };

export const listAdminCategories: RequestHandler =
    async (_request, response) => {
        const categories =
            await getAllCategories();

        response.status(200).json({
            success: true,
            message:
                "Categories retrieved successfully",
            data: {
                categories: categories.map(
                    mapCategoryResponse,
                ),
            },
        });
    };

export const createCategoryHandler: RequestHandler<
    Record<string, never>,
    unknown,
    CreateCategoryInput
> = async (request, response) => {
    const category = await createCategory(
        request.body,
    );

    response.status(201).json({
        success: true,
        message: "Category created successfully",
        data: {
            category: mapCategoryResponse(category),
        },
    });
};

export const updateCategoryHandler: RequestHandler<
    CategoryParams,
    unknown,
    UpdateCategoryInput
> = async (request, response) => {
    const category = await updateCategory(
        request.params.categoryId,
        request.body,
    );

    response.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: {
            category: mapCategoryResponse(category),
        },
    });
};

export const deleteCategoryHandler: RequestHandler<
    CategoryParams
> = async (request, response) => {
    const category = await deactivateCategory(
        request.params.categoryId,
    );

    response.status(200).json({
        success: true,
        message:
            "Category deactivated successfully",
        data: {
            category: mapCategoryResponse(category),
        },
    });
};