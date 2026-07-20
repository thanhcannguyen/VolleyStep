
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose";

export interface ProductVariant {
    _id: Types.ObjectId;
    sku: string;
    color: string;
    size: string;
    price: number;
    stock: number;
    images: string[];
}

export interface Product {
    name: string;
    slug: string;
    description: string;
    brandId: Types.ObjectId;
    categoryId: Types.ObjectId;
    variants: ProductVariant[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;

export type ProductModel = Model<Product>;

const productVariantSchema = new Schema<ProductVariant>(
    {
        sku: {
            type: String,
            required: [true, "Variant SKU is required"],
            trim: true,
            uppercase: true,
            minlength: [2, "Variant SKU must contain at least 2 characters"],
            maxlength: [80, "Variant SKU must contain at most 80 characters"],
        },
        color: {
            type: String,
            required: [true, "Variant color is required"],
            trim: true,
            minlength: [1, "Variant color is required"],
            maxlength: [50, "Variant color must contain at most 50 characters"],
        },
        size: {
            type: String,
            required: [true, "Variant size is required"],
            trim: true,
            minlength: [1, "Variant size is required"],
            maxlength: [20, "Variant size must contain at most 20 characters"],
        },
        price: {
            type: Number,
            required: [true, "Variant price is required"],
            min: [0, "Variant price must be greater than or equal to 0"],
            validate: {
                validator: Number.isInteger,
                message: "Variant price must be an integer in VND",
            },
        },
        stock: {
            type: Number,
            required: [true, "Variant stock is required"],
            min: [0, "Variant stock must be greater than or equal to 0"],
            validate: {
                validator: Number.isInteger,
                message: "Variant stock must be an integer",
            },
        },
        images: {
            type: [String],
            required: [true, "Variant must contain at least one image"],
            validate: {
                validator: (images: string[]) =>
                    images.length > 0 && images.length <= 10,
                message: "Variant must contain between 1 and 10 images",
            },
        },
    },
    {
        _id: true,
        versionKey: false,
    },
);

const productSchema = new Schema<Product, ProductModel>(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: [2, "Product name must contain at least 2 characters"],
            maxlength: [150, "Product name must contain at most 150 characters"],
        },
        slug: {
            type: String,
            required: [true, "Product slug is required"],
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true,
            minlength: [10, "Product description must contain at least 10 characters"],
            maxlength: [5000, "Product description must contain at most 5000 characters"],
        },
        brandId: {
            type: Schema.Types.ObjectId,
            ref: "Brand",
            required: [true, "Product brand is required"],
            index: true,
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Product category is required"],
            index: true,
        },
        variants: {
            type: [productVariantSchema],
            required: [true, "Product must contain at least one variant"],
            validate: {
                validator: (variants: ProductVariant[]) =>
                    variants.length > 0 && variants.length <= 100,
                message: "Product must contain between 1 and 100 variants",
            },
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

productSchema.index({ slug: 1 }, { unique: true, name: "product_slug_unique" });
productSchema.index(
    { "variants.sku": 1 },
    { unique: true, name: "product_variant_sku_unique" },
);
productSchema.index(
    { isActive: 1, brandId: 1, categoryId: 1 },
    { name: "product_catalog_filters" },
);
productSchema.index({ name: "text", description: "text", "variants.sku": "text", }, { name: "product_text_search", weights: { name: 10, "variants.sku": 8, description: 2, }, default_language: "none", },);

export const ProductModel = model<Product, ProductModel>("Product", productSchema);