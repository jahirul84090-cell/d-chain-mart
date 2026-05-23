import ClickToTop from "@/components/others/ClickTop";
import FloatingMessenger from "@/components/others/FloatingMessenger";
import Footer from "@/components/others/Footer";
import EcommerceHeader from "@/components/others/Header";

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

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    locale: "bn_BD",
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

  manifest: "/site.webmanifest",

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

export default function MainLayout({ children }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/og-default.png`,
    description:
      "D Chin Mart is an online shopping platform in Bangladesh for mobiles, laptops, electronics, accessories and EMI shopping.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
    },
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    sameAs: [],
  };

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
<ClickToTop/>
{/* <FloatingMessenger/> */}
      <main className="main-content overflow-x-hidden">
      
          {children}
     
      </main>

      <Footer />
    </>
  );
}