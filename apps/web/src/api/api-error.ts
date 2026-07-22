
import type { ApiValidationError } from "./api.types";

export class ApiError extends Error {
    public readonly statusCode?: number;
    public readonly errors?: ApiValidationError[];

    constructor(
        message: string,
        statusCode?: number,
        errors?: ApiValidationError[],
    ) {
        super(message);

        this.name = "ApiError";
        this.statusCode = statusCode;
        this.errors = errors;
    }
}