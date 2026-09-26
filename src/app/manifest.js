import { SITE_NAME } from "@/lib/site";

export default function manifest() {
  return {
    name: `${SITE_NAME} — Online Shopping in Bangladesh`,
    short_name: SITE_NAME,
    description:
      "Shop mobiles, laptops, electronics and more with cash on delivery and EMI across Bangladesh.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2ea7f2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
