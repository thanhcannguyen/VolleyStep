
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/route-paths";

export function NotFound() {
    return (
        <main className="page-center">
            <div>
                <h1>404</h1>
                <p>Trang bạn tìm kiếm không tồn tại.</p>
                <Link to={ROUTE_PATHS.home}>Quay về trang chủ</Link>
            </div>
        </main>
    );
}