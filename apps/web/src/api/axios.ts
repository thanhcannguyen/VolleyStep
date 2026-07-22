
import axios, { AxiosError } from "axios";

import { ApiError } from "./api-error";
import type { ApiErrorResponse } from "./api.types";

const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl) {
    throw new Error("VITE_API_URL is not configured");
}

export const apiClient = axios.create({
    baseURL: apiBaseUrl,
    timeout: 15_000,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
        if (!error.response) {
            return Promise.reject(
                new ApiError(
                    "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối.",
                ),
            );
        }

        const responseData = error.response.data;

        return Promise.reject(
            new ApiError(
                responseData?.message ?? "Đã xảy ra lỗi từ máy chủ.",
                error.response.status,
                responseData?.errors,
            ),
        );
    },
);