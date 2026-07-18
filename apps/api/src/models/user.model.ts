
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
} from "mongoose";

export const USER_ROLES = ["CUSTOMER", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "DISABLED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
    fullName: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

export type UserModel = Model<User>;

const userSchema = new Schema<User, UserModel>(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            minlength: [2, "Full name must contain at least 2 characters"],
            maxlength: [100, "Full name must contain at most 100 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            maxlength: [254, "Email must contain at most 254 characters"],
        },

        passwordHash: {
            type: String,
            required: [true, "Password hash is required"],
            select: false,
        },

        role: {
            type: String,
            enum: {
                values: USER_ROLES,
                message: "Invalid user role: {VALUE}",
            },
            default: "CUSTOMER",
        },

        status: {
            type: String,
            enum: {
                values: USER_STATUSES,
                message: "Invalid user status: {VALUE}",
            },
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
        versionKey: false,

        toJSON: {
            transform: (_document, returnedObject: any) => { // Thêm : any ở đây
                delete returnedObject.passwordHash;
            },
        },

        toObject: {
            transform: (_document, returnedObject: any) => { // Thêm : any ở đây
                delete returnedObject.passwordHash;
            },
        },
    }
);

userSchema.index(
    { email: 1 },
    {
        unique: true,
        name: "user_email_unique",
    },
);

export const UserModel = model<User, UserModel>("User", userSchema);