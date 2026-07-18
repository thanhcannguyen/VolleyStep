
import type { UserRole } from "../models/user.model";

export interface AccessTokenPayload {
    sub: string;
    role: UserRole;
    type: "access";
}

export interface RefreshTokenPayload {
    sub: string;
    sessionId: string;
    type: "refresh";
}

export interface AuthenticatedUser {
    id: string;
    role: UserRole;
}