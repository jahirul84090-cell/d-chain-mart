// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠ CORRECTED CONFIGURATION ⚠
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        // You can add pathname: '/path/to/assets/**' if needed for security
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
