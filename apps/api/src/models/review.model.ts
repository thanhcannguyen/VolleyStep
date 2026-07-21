
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose";

export interface Review {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
    orderId: Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type ReviewDocument = HydratedDocument<Review>;
export type ReviewModel = Model<Review>;

const reviewSchema = new Schema<Review, ReviewModel>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be an integer between 1 and 5",
            },
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

reviewSchema.index(
    { productId: 1, userId: 1 },
    {
        unique: true,
        name: "review_product_user_unique",
    },
);

reviewSchema.index(
    { productId: 1, createdAt: -1 },
    { name: "review_product_created_at" },
);

export const ReviewModel = model<Review, ReviewModel>(
    "Review",
    reviewSchema,
);