
import { apiClient } from "@/lib/api/api-client";
import type { ApiSuccessResponse } from "@/lib/api/api.types";

// Thêm export ở đây để các file khác (như custom hook) sử dụng trực tiếp
export interface HealthData {
    status?: string;
}

export async function getHealthStatus(): Promise<
    ApiSuccessResponse<HealthData>
> {
    const response =
        await apiClient.get<ApiSuccessResponse<HealthData>>("/health");

    return response.data;
}