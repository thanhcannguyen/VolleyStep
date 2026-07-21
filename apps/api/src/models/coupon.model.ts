
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
} from "mongoose";

export const COUPON_TYPES = [
    "PERCENTAGE",
    "FIXED",
] as const;

export type CouponType = (typeof COUPON_TYPES)[number];

export interface Coupon {
    code: string;
    type: CouponType;
    value: number;
    minOrderAmount: number;
    maxUsageCount: number;
    usageCount: number;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type CouponDocument = HydratedDocument<Coupon>;
export type CouponModel = Model<Coupon>;

const couponSchema = new Schema<Coupon, CouponModel>(
    {
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        type: {
            type: String,
            enum: COUPON_TYPES,
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Coupon value must be an integer",
            },
        },
        minOrderAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        maxUsageCount: {
            type: Number,
            required: true,
            min: 1,
        },
        usageCount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

couponSchema.index(
    { code: 1 },
    { unique: true, name: "coupon_code_unique" },
);

couponSchema.pre("validate", function (this: CouponDocument) {
    if (this.type === "PERCENTAGE" && this.value > 100) {
        this.invalidate(
            "value",
            "Percentage value must not exceed 100",
        );
    }
});

export const CouponModel = model<Coupon, CouponModel>(
    "Coupon",
    couponSchema,
);