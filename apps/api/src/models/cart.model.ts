
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose";

export interface CartItem {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    variantId: Types.ObjectId;
    quantity: number;
    currentPrice: number;
}

export interface Cart {
    userId: Types.ObjectId;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}

export type CartDocument = HydratedDocument<Cart>;

export type CartModel = Model<Cart>;

const cartItemSchema = new Schema<CartItem>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Cart item product is required"],
        },
        variantId: {
            type: Schema.Types.ObjectId,
            required: [true, "Cart item variant is required"],
        },
        quantity: {
            type: Number,
            required: [true, "Cart item quantity is required"],
            min: [1, "Cart item quantity must be at least 1"],
            max: [99, "Cart item quantity must be at most 99"],
            validate: {
                validator: Number.isInteger,
                message: "Cart item quantity must be an integer",
            },
        },
        currentPrice: {
            type: Number,
            required: [true, "Cart item current price is required"],
            min: [0, "Cart item current price must not be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Cart item current price must be an integer in VND",
            },
        },
    },
    {
        _id: true,
        versionKey: false,
    }
);

const cartSchema = new Schema<Cart, CartModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Cart user is required"],
        },
        items: {
            type: [cartItemSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

cartSchema.index(
    { userId: 1 },
    { unique: true, name: "cart_user_unique" }
);

cartSchema.index(
    { "items.productId": 1, "items.variantId": 1 },
    { name: "cart_product_variant" }
);

export const CartModel = model<Cart, CartModel>("Cart", cartSchema);