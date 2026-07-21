
export interface ApiSuccessResponse<T> {
    success: true;
    message: string;
    data: T;
}

export interface ApiValidationError {
    field: string;
    message: string;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: ApiValidationError[];
}

export interface Pagination {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}