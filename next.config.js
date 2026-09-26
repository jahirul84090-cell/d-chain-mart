// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  poweredByHeader: false,

  // Product pages live at /{slug}. Older structured data pointed at
  // /product/{slug}; send any such links to the real page permanently.
  async redirects() {
    return [
      { source: "/product/:slug", destination: "/:slug", permanent: true },
      // Section roots in the admin go to their list pages.
      { source: "/dashboard/product", destination: "/dashboard/product/manage", permanent: false },
      { source: "/dashboard/order", destination: "/dashboard/order/manage", permanent: false },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

module.exports = nextConfig;