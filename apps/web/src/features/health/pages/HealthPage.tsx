
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { ApiError } from "@/lib/api/api-error";

import { useHealthCheck } from "../hooks/useHealthCheck";

export function HealthPage() {
    const healthQuery = useHealthCheck();

    if (healthQuery.isPending) {
        return <LoadingScreen />;
    }

    if (healthQuery.isError) {
        const message =
            healthQuery.error instanceof ApiError
                ? healthQuery.error.message
                : "Không thể kiểm tra trạng thái backend.";

        return (
            <ErrorMessage
                message={message}
                onRetry={() => {
                    void healthQuery.refetch();
                }}
            />
        );
    }

    return (
        <main className="page-center">
            <section className="health-card">
                <h1>VolleyStep</h1>
                <p>Frontend đã kết nối thành công với backend.</p>
                <p>{healthQuery.data.message}</p>
            </section>
        </main>
    );
}