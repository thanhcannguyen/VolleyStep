
export const ROUTE_PATHS = {
    home: "/",
    health: "/health",

    products: "/products",
    productDetail: "/products/:slug",

    login: "/login",
    register: "/register",

    cart: "/cart",
    checkout: "/checkout",

    account: "/account",
    accountOrders: "/account/orders",

    admin: "/admin",
    adminDashboard: "/admin/dashboard",
    adminProducts: "/admin/products",
} as const;