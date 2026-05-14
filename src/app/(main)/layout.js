// app/(main)/layout.js

import Footer from "@/components/others/Footer";
import EcommerceHeader from "@/components/others/Header";

const siteName = process.env.SITE_NAME || "BD Store";
const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://example.com"
).replace(/\/+$/, "");

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    template: "%s | BD Store",
    default: "BD Store — Online Shopping in Bangladesh",
  },

  description:
    "BD Store is your one-stop online shop in Bangladesh for quality products at the best price.",

  applicationName: siteName,

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // ✅ Open Graph (valid types for Next.js)
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "BD Store — Online Shopping in Bangladesh",
    description:
      "Shop top products in Bangladesh with fast delivery, secure checkout, and great deals.",
    images: [
      {
        url: `${siteUrl}/og-default.png`, // put this image in /public/og-default.png
        width: 1200,
        height: 630,
        alt: "BD Store",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "BD Store — Online Shopping in Bangladesh",
    description:
      "Shop top products in Bangladesh with fast delivery, secure checkout, and great deals.",
    images: [`${siteUrl}/og-default.png`],
  },

  // ✅ Helps Google understand your brand / site
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  // Optional: add keywords globally (page-level keywords still better)
  keywords: ["BD Store", "ecommerce", "online shopping", "Bangladesh"],

  // Optional: verification codes (set env and uncomment)
  // verification: {
  //   google: process.env.GOOGLE_SITE_VERIFICATION,
  // },

  // Optional: if you prefer no referrer leakage
  // referrer: "origin-when-cross-origin",
};

export default function MainLayout({ children }) {
  // ✅ Organization JSON-LD (global)
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`, // add /public/logo.png
  };

  // ✅ Website JSON-LD (global)
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <EcommerceHeader />
      <main className="main-content">{children}</main>
      <Footer />
    </>
  );
}
