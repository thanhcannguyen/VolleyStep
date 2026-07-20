
import {
    CategoryModel,
    type CategoryDocument,
} from "../models/category.model";
import type {
    CreateCategoryInput,
    UpdateCategoryInput,
} from "../schemas/catalog.schema";
import { AppError } from "../utils/app-error";
import { isDuplicateKeyError } from "../utils/duplicate-key";
import { createSlug } from "../utils/slug";

export const getActiveCategories =
    async (): Promise<CategoryDocument[]> => {
        return CategoryModel.find({
            isActive: true,
        }).sort({
            name: 1,
        });
    };

export const getAllCategories =
    async (): Promise<CategoryDocument[]> => {
        return CategoryModel.find().sort({
            isActive: -1,
            name: 1,
        });
    };

export const createCategory = async (
    input: CreateCategoryInput,
): Promise<CategoryDocument> => {
    const slug = createSlug(input.name);

    const existingCategory =
        await CategoryModel.exists({
            slug,
        });

    if (existingCategory) {
        throw new AppError(
            "Category already exists",
            409,
        );
    }

    try {
        return await CategoryModel.create({
            name: input.name,
            slug,
            description: input.description,
        });
    } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
            throw new AppError(
                "Category already exists",
                409,
            );
        }

        throw error;
    }
};

export const updateCategory = async (
    categoryId: string,
    input: UpdateCategoryInput,
): Promise<CategoryDocument> => {
    const category =
        await CategoryModel.findById(categoryId);

    if (!category) {
        throw new AppError(
            "Category not found",
            404,
        );
    }

    if (input.name !== undefined) {
        const slug = createSlug(input.name);

        const duplicateCategory =
            await CategoryModel.exists({
                slug,
                _id: {
                    $ne: category._id,
                },
            });

        if (duplicateCategory) {
            throw new AppError(
                "Category already exists",
                409,
            );
        }

        category.name = input.name;
        category.slug = slug;
    }

    if (input.description !== undefined) {
        category.description =
            input.description;
    }

    if (input.isActive !== undefined) {
        category.isActive = input.isActive;
    }

    try {
        await category.save();
        return category;
    } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
            throw new AppError(
                "Category already exists",
                409,
            );
        }

        throw error;
    }
};

export const deactivateCategory = async (
    categoryId: string,
): Promise<CategoryDocument> => {
    const category =
        await CategoryModel.findById(categoryId);

    if (!category) {
        throw new AppError(
            "Category not found",
            404,
        );
    }

    if (!category.isActive) {
        return category;
    }

    category.isActive = false;

    await category.save();

    return category;
};