import ClickToTop from "@/components/others/ClickTop";
import Footer from "@/components/others/Footer";
import HideOnRoutes from "@/components/others/HideOnRoutes";
import EcommerceHeader from "@/components/others/Header";
import { getCategories, safely } from "@/lib/storefront";
import { toJsonLd } from "@/lib/jsonld";

const siteName = process.env.SITE_NAME || "D Chin Mart";
const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dchinmart.com"
).replace(/\/+$/, "");

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    template: `%s | ${siteName}`,
    default:
      "D Chin Mart — Online Shopping in Bangladesh",
  },

  description:
    "D Chin Mart is Bangladesh's trusted online store. Shop electronics, fashion, home goods & more with fast delivery across BD. Best prices guaranteed, cash on delivery and EMI facilities available.",

  applicationName: siteName,

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

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    locale: "en_BD",
    title: "D Chin Mart — Online Shopping in Bangladesh",
    description:
      "Shop top products in Bangladesh with fast delivery, secure checkout & great deals. Electronics, fashion, home goods & more.",
    images: [
      {
        url: `${siteUrl}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "D Chin Mart — Online Shopping Bangladesh",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "D Chin Mart | Online Shopping for Mobiles & Electronics",
    description:
      "Shop mobiles, laptops, electronics and accessories online in Bangladesh with COD and EMI facilities.",
    images: [`${siteUrl}/og-default.png`],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  keywords: [
    "D Chin Mart",
    "D Chin Mart Bangladesh",
    "online shopping Bangladesh",
    "mobile price in Bangladesh",
    "laptop price in Bangladesh",
    "electronics shop Bangladesh",
    "EMI shopping Bangladesh",
    "cash on delivery Bangladesh",
    "buy now pay later Bangladesh",
  ],
};

export default async function MainLayout({ children }) {
  const categories = await safely(getCategories(), null);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/allproducts?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }}
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-primary"
      >
        Skip to content
      </a>
      <EcommerceHeader initialCategories={categories ?? undefined} />
      <ClickToTop />
      <main id="main-content" className="main-content overflow-x-hidden">
        {children}
      </main>

      {/* A focused checkout: no footer links to leave the purchase. */}
      <HideOnRoutes routes={["/checkout"]}>
        <Footer />
      </HideOnRoutes>
    </>
  );
}