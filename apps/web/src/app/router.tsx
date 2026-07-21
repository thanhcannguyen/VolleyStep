
import { createBrowserRouter, Navigate } from "react-router-dom";

import { NotFound } from "@/components/common/NotFound";
import { HealthPage } from "@/features/health/pages/HealthPage";

import { ROUTE_PATHS } from "./route-paths";

export const router = createBrowserRouter([
    {
        path: ROUTE_PATHS.home,
        element: <Navigate to={ROUTE_PATHS.health} replace />,
    },
    {
        path: ROUTE_PATHS.health,
        element: <HealthPage />,
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);