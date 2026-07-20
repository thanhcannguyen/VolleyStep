
import {
    BrandModel,
    type BrandDocument,
} from "../models/brand.model";
import type {
    CreateBrandInput,
    UpdateBrandInput,
} from "../schemas/catalog.schema";
import { AppError } from "../utils/app-error";
import { isDuplicateKeyError } from "../utils/duplicate-key";
import { createSlug } from "../utils/slug";

export const getActiveBrands = async (): Promise<
    BrandDocument[]
> => {
    return BrandModel.find({
        isActive: true,
    }).sort({
        name: 1,
    });
};

export const getAllBrands = async (): Promise<
    BrandDocument[]
> => {
    return BrandModel.find().sort({
        isActive: -1,
        name: 1,
    });
};

export const createBrand = async (
    input: CreateBrandInput,
): Promise<BrandDocument> => {
    const slug = createSlug(input.name);

    const existingBrand = await BrandModel.exists({
        slug,
    });

    if (existingBrand) {
        throw new AppError(
            "Brand already exists",
            409,
        );
    }

    try {
        return await BrandModel.create({
            name: input.name,
            slug,
            description: input.description,
        });
    } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
            throw new AppError(
                "Brand already exists",
                409,
            );
        }

        throw error;
    }
};

export const updateBrand = async (
    brandId: string,
    input: UpdateBrandInput,
): Promise<BrandDocument> => {
    const brand = await BrandModel.findById(
        brandId,
    );

    if (!brand) {
        throw new AppError("Brand not found", 404);
    }

    if (input.name !== undefined) {
        const slug = createSlug(input.name);

        const duplicateBrand =
            await BrandModel.exists({
                slug,
                _id: {
                    $ne: brand._id,
                },
            });

        if (duplicateBrand) {
            throw new AppError(
                "Brand already exists",
                409,
            );
        }

        brand.name = input.name;
        brand.slug = slug;
    }

    if (input.description !== undefined) {
        brand.description = input.description;
    }

    if (input.isActive !== undefined) {
        brand.isActive = input.isActive;
    }

    try {
        await brand.save();
        return brand;
    } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
            throw new AppError(
                "Brand already exists",
                409,
            );
        }

        throw error;
    }
};

export const deactivateBrand = async (
    brandId: string,
): Promise<BrandDocument> => {
    const brand = await BrandModel.findById(
        brandId,
    );

    if (!brand) {
        throw new AppError("Brand not found", 404);
    }

    if (!brand.isActive) {
        return brand;
    }

    brand.isActive = false;

    await brand.save();

    return brand;
};