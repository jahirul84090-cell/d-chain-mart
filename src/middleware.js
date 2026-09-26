import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Page prefixes that are matched only so they get noindex headers.
const publicPagePrefixes = ["/auth/", "/payment/"];

const publicApiPaths = [
  { path: "/api/admin/product", method: "GET" },
  { path: "/api/admin/categories", method: "GET" },
  { path: "/api/admin/product/related", method: "GET" },
  { path: "/api/admin/categories/categoryproduct", method: "GET" },
  { path: "/api/admin/product/", method: "GET", prefix: true },
  { path: "/api/auth", method: "ALL", prefix: true },
  { path: "/api/payment/sslcommerz", method: "ALL", prefix: true },
];

// Pages that must never appear in search results.
const noIndexPrefixes = [
  "/dashboard",
  "/profile",
  "/details",
  "/orders",
  "/checkout",
  "/cart",
  "/wishlist",
  "/loans",
  "/auth",
  "/payment",
];

function withNoIndex(response, pathname) {
  if (noIndexPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const { method } = req;
  const isApi = pathname.startsWith("/api/");

  try {
    const isPublicPath = publicPagePrefixes.some((p) => pathname.startsWith(p));
    const isPublicApi = publicApiPaths.some((api) => {
      const isMethodMatch = api.method === "ALL" || api.method === method;
      const isPathMatch = api.prefix
        ? pathname.startsWith(api.path)
        : pathname === api.path;
      return isMethodMatch && isPathMatch;
    });

    if (isPublicPath || isPublicApi) {
      return withNoIndex(NextResponse.next(), pathname);
    }

    const token = await getToken({ req });

    if (!token) {
      if (isApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Send the user back to where they were after signing in.
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/dashboard") && token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return withNoIndex(NextResponse.next(), pathname);
  } catch (error) {
    if (isApi) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
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
    "/orders/:path*",
    "/checkout",
    "/cart",
    "/loans/:path*",
    "/wishlist",
    "/payment/:path*",
    "/api/:path*",
    "/auth/:path*",
  ],
};
