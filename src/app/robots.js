import { SITE_URL } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/profile",
          "/details",
          "/orders",
          "/checkout",
          "/cart",
          "/wishlist",
          "/auth/",
          "/loans/details",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
