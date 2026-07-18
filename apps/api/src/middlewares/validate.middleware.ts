
import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError } from "../utils/app-error";

export interface ValidationIssue {
    field: string;
    message: string;
}

export class ValidationError extends AppError {
    public readonly errors: ValidationIssue[];

    constructor(errors: ValidationIssue[]) {
        super("Validation failed", 400);

        this.name = "ValidationError";
        this.errors = errors;
    }
}

export const validate = (
    schema: ZodType,
): RequestHandler => {
    return (request, _response, next) => {
        const result = schema.safeParse({
            body: request.body,
            params: request.params,
            query: request.query,
        });

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join(".").replace(/^body\./, ""),
                message: issue.message,
            }));

            next(new ValidationError(errors));
            return;
        }

        if (
            typeof result.data === "object" &&
            result.data !== null &&
            "body" in result.data
        ) {
            request.body = result.data.body;
        }

        next();
    };
};