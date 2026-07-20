
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
} from "mongoose";

export interface Category {
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type CategoryDocument =
    HydratedDocument<Category>;

export type CategoryModel = Model<Category>;

const categorySchema = new Schema<
    Category,
    CategoryModel
>(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            minlength: [
                2,
                "Category name must contain at least 2 characters",
            ],
            maxlength: [
                100,
                "Category name must contain at most 100 characters",
            ],
        },

        slug: {
            type: String,
            required: [true, "Category slug is required"],
            trim: true,
            lowercase: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Category description must contain at most 500 characters",
            ],
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

categorySchema.index(
    { slug: 1 },
    {
        unique: true,
        name: "category_slug_unique",
    },
);

categorySchema.index(
    {
        isActive: 1,
        name: 1,
    },
    {
        name: "category_active_name",
    },
);

export const CategoryModel = model<
    Category,
    CategoryModel
>("Category", categorySchema);