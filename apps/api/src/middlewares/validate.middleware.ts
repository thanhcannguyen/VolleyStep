
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
                // Bỏ tiền tố body., params., query. để field trả về đẹp mắt (ví dụ: 'page' thay vì 'query.page')
                field: issue.path.join(".").replace(/^(body|params|query)\./, ""),
                message: issue.message,
            }));

            next(new ValidationError(errors));
            return;
        }

        // Cập nhật dữ liệu đã qua Zod transform/coercion ngược lại vào Express Request
        if (typeof result.data === "object" && result.data !== null) {
            const parsedData = result.data as Record<string, unknown>;

            if ("body" in parsedData) {
                request.body = parsedData.body;
            }

            if ("query" in parsedData) {
                request.query = parsedData.query as typeof request.query;
            }

            if ("params" in parsedData) {
                request.params = parsedData.params as typeof request.params;
            }
        }

        next();
    };
};