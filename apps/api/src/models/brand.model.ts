
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
} from "mongoose";

export interface Brand {
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type BrandDocument = HydratedDocument<Brand>;

export type BrandModel = Model<Brand>;

const brandSchema = new Schema<Brand, BrandModel>(
    {
        name: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true,
            minlength: [
                2,
                "Brand name must contain at least 2 characters",
            ],
            maxlength: [
                80,
                "Brand name must contain at most 80 characters",
            ],
        },

        slug: {
            type: String,
            required: [true, "Brand slug is required"],
            trim: true,
            lowercase: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Brand description must contain at most 500 characters",
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

brandSchema.index(
    { slug: 1 },
    {
        unique: true,
        name: "brand_slug_unique",
    },
);

brandSchema.index(
    {
        isActive: 1,
        name: 1,
    },
    {
        name: "brand_active_name",
    },
);

export const BrandModel = model<Brand, BrandModel>(
    "Brand",
    brandSchema,
);