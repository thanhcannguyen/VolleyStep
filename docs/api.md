
# VolleyStep API Reference

Base URL (local): http://localhost:5000
Base URL (production): điền URL Render sau khi deploy

## Auth
POST   /api/auth/register        Public
POST   /api/auth/login           Public
POST   /api/auth/refresh         Public (refresh token)
POST   /api/auth/logout          Customer/Admin
GET    /api/auth/me              Customer/Admin

## Brands
GET    /api/brands               Public
GET    /api/admin/brands         Admin
POST   /api/admin/brands         Admin
PATCH  /api/admin/brands/:id     Admin

## Categories
GET    /api/categories           Public
GET    /api/admin/categories     Admin
POST   /api/admin/categories     Admin
PATCH  /api/admin/categories/:id Admin

## Products
GET    /api/products             Public (pagination, filter, search)
GET    /api/products/:slug       Public
GET    /api/admin/products       Admin
POST   /api/admin/products       Admin
PATCH  /api/admin/products/:id   Admin

## Cart
GET    /api/cart                 Customer
POST   /api/cart/items           Customer
PATCH  /api/cart/items/:itemId   Customer
DELETE /api/cart/items/:itemId   Customer

## Orders
POST   /api/orders/checkout            Customer
GET    /api/orders                     Customer (own orders)
GET    /api/orders/:orderId            Customer (own order)
GET    /api/admin/orders               Admin
GET    /api/admin/orders/:orderId      Admin
PATCH  /api/admin/orders/:orderId/status  Admin

## Coupons
POST   /api/admin/coupons        Admin
GET    /api/admin/coupons        Admin
GET    /api/admin/coupons/:id    Admin
PATCH  /api/admin/coupons/:id    Admin

## Reviews
POST   /api/products/:productId/reviews   Customer (đã DELIVERED)
GET    /api/products/:productId/reviews   Public