
import { useQuery } from "@tanstack/react-query";

import { getHealthStatus } from "../api/health.api";

export function useHealthCheck() {
    return useQuery({
        queryKey: ["health"],
        queryFn: getHealthStatus,
        retry: 1,
    });
}