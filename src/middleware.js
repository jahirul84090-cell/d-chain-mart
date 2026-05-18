import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  try {
    const { pathname, searchParams } = req.nextUrl;
    const { method } = req;

    const publicPaths = ["/auth/login", "/auth/error"];

    const publicApiPaths = [
      { path: "/api/admin/product", method: "GET" },
      { path: "/api/admin/categories", method: "GET" },
      { path: "/api/admin/product/related", method: "GET" },
      { path: "/api/admin/categories/categoryproduct", method: "GET" },
      { path: "/api/admin/product/", method: "GET", prefix: true },
      {
        path: "/api/dashboard/doctors/specialties/slug/",
        method: "GET",
        prefix: true,
      },
      { path: "/api/auth", method: "ALL", prefix: true },
      { path: "/api/payment/sslcommerz", method: "ALL", prefix: true },
    ];

    const isPublicPath = publicPaths.includes(pathname);
    const isPublicApi = publicApiPaths.some((api) => {
      const isMethodMatch = api.method === "ALL" || api.method === method;
      const isPathMatch = api.prefix
        ? pathname.startsWith(api.path)
        : pathname === api.path;
      return isMethodMatch && isPathMatch;
    });

    if (isPublicPath || isPublicApi) {
      return NextResponse.next();
    }

    const token = await getToken({ req });

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const userRole = token.role;

    if (pathname.startsWith("/dashboard") && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(
      new URL("/auth/error?error=MiddlewareError", req.url)
    );
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/details",
    "/orders",
    "/checkout",
    "/cart",
    "/wishlist",
    "/api/:path*",
    "/auth/login",
    "/auth/error",
  ],
};
