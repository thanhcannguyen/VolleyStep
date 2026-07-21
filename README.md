
# VolleyStep

## English
VolleyStep is a fullstack ecommerce platform for volleyball shoes, built as a portfolio project for a Fresher/Junior Fullstack Developer position.

### Tech stack
- Monorepo: pnpm workspace
- Backend: Node.js, Express 5, TypeScript, Mongoose, Zod, JWT
- Database: MongoDB Atlas
- Frontend: React, Vite, TypeScript (in progress)

### Getting started (backend)
1. Copy apps/api/.env.example to apps/api/.env and fill in real values (MongoDB Atlas URI, JWT secrets).
2. Install dependencies from the repo root:
   pnpm install
3. Run the API in development mode:
   pnpm dev:api
4. Seed sample data (optional, safe to re-run):
   pnpm seed:api
5. API runs at http://localhost:5000, health check at GET /api/health.

### Scripts (run from repo root)
- pnpm dev:api        Run API in watch mode
- pnpm build:api       Build API for production
- pnpm start:api       Run built API
- pnpm typecheck       Type-check the API
- pnpm seed:api        Seed sample data

### API documentation
See docs/api.md for the full endpoint list.

### Sample accounts after seeding
- Admin: admin@volleystep.local / Admin@123456
- Customer: customer@volleystep.local / Customer@123456

---

## Tiếng Việt
VolleyStep là một website ecommerce fullstack chuyên bán giày bóng chuyền, được xây dựng làm portfolio ứng tuyển vị trí Fresher/Junior Fullstack Developer.

### Công nghệ sử dụng
- Monorepo: pnpm workspace
- Backend: Node.js, Express 5, TypeScript, Mongoose, Zod, JWT
- Database: MongoDB Atlas
- Frontend: React, Vite, TypeScript (đang phát triển)

### Hướng dẫn chạy dự án (backend)
1. Copy apps/api/.env.example thành apps/api/.env, điền giá trị thật (MongoDB Atlas URI, JWT secrets).
2. Cài dependency từ repo root:
   pnpm install
3. Chạy API ở chế độ development:
   pnpm dev:api
4. Seed dữ liệu mẫu (tùy chọn, chạy lại nhiều lần vẫn an toàn):
   pnpm seed:api
5. API chạy tại http://localhost:5000, health check tại GET /api/health.

### Scripts (chạy từ repo root)
- pnpm dev:api        Chạy API ở chế độ watch
- pnpm build:api       Build API cho production
- pnpm start:api       Chạy bản build
- pnpm typecheck       Kiểm tra type
- pnpm seed:api        Seed dữ liệu mẫu

### Tài liệu API
Xem docs/api.md để biết danh sách endpoint đầy đủ.

### Tài khoản mẫu sau khi seed
- Admin: admin@volleystep.local / Admin@123456
- Customer: customer@volleystep.local / Customer@123456