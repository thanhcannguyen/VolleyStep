
import {
    model,
    Schema,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose";

export interface Session {
    userId: Types.ObjectId;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type SessionDocument = HydratedDocument<Session>;

export type SessionModel = Model<Session>;

const sessionSchema = new Schema<Session, SessionModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        refreshTokenHash: {
            type: String,
            required: true,
            select: false,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        revokedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

sessionSchema.index(
    { expiresAt: 1 },
    {
        expireAfterSeconds: 0,
        name: "session_expiry_ttl",
    },
);

sessionSchema.index(
    { userId: 1, revokedAt: 1 },
    {
        name: "session_user_revoked",
    },
);

export const SessionModel = model<Session, SessionModel>(
    "Session",
    sessionSchema,
);