
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose";

export const ORDER_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItemSnapshot {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    variantId: Types.ObjectId;
    productName: string;
    productSlug: string;
    sku: string;
    color: string;
    size: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    image: string | null;
}

export interface ShippingAddressSnapshot {
    recipientName: string;
    phone: string;
    addressLine: string;
    ward?: string;
    district: string;
    province: string;
    postalCode?: string;
}

export interface Order {
    orderNumber: string;
    userId: Types.ObjectId;
    items: OrderItemSnapshot[];
    shippingAddress: ShippingAddressSnapshot;
    subtotal: number;
    shippingFee: number;
    couponCode: string | null;
    discountAmount: number;
    total: number;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}

export type OrderDocument = HydratedDocument<Order>;
export type OrderModel = Model<Order>;

const integerMoneyValidator = {
    validator: Number.isInteger,
    message: "Money value must be an integer in VND",
};

const orderItemSchema = new Schema<OrderItemSnapshot>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        variantId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        productName: {
            type: String,
            required: true,
            trim: true,
        },
        productSlug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        sku: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
        },
        size: {
            type: String,
            required: true,
            trim: true,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
            validate: integerMoneyValidator,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Order item quantity must be an integer",
            },
        },
        lineTotal: {
            type: Number,
            required: true,
            min: 0,
            validate: integerMoneyValidator,
        },
        image: {
            type: String,
            default: null,
        },
    },
    {
        _id: true,
        versionKey: false,
    },
);

const shippingAddressSchema = new Schema<ShippingAddressSnapshot>(
    {
        recipientName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        addressLine: {
            type: String,
            required: true,
            trim: true,
        },
        ward: {
            type: String,
            trim: true,
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        province: {
            type: String,
            required: true,
            trim: true,
        },
        postalCode: {
            type: String,
            trim: true,
        },
    },
    {
        _id: false,
        versionKey: false,
    },
);

const orderSchema = new Schema<Order, OrderModel>(
    {
        orderNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items: OrderItemSnapshot[]) => items.length > 0,
                message: "Order must contain at least one item",
            },
        },
        shippingAddress: {
            type: shippingAddressSchema,
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
            validate: integerMoneyValidator,
        },
        shippingFee: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            validate: integerMoneyValidator,
        },
        couponCode: {
            type: String,
            default: null,
            trim: true,
            uppercase: true,
        },
        discountAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            validate: integerMoneyValidator,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
            validate: integerMoneyValidator,
        },
        status: {
            type: String,
            enum: ORDER_STATUSES,
            default: "PENDING",
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

orderSchema.index(
    { orderNumber: 1 },
    {
        unique: true,
        name: "order_number_unique",
    },
);

orderSchema.index(
    { userId: 1, createdAt: -1 },
    { name: "order_user_created_at" },
);

orderSchema.index(
    { status: 1, createdAt: -1 },
    { name: "order_status_created_at" },
);

export const OrderModel = model<Order, OrderModel>("Order", orderSchema);