export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/materials/:path*",
    "/products/:path*",
    "/logistics/:path*",
    "/sales/:path*",
    "/calculator/:path*",
    "/api/materials/:path*",
    "/api/products/:path*",
    "/api/logistics/:path*",
    "/api/sales/:path*",
    "/api/dashboard/:path*",
  ],
};
