import ContactClient from "@/components/others/ContactClient";
import { toJsonLd } from "@/lib/jsonld";

const siteName = process.env.SITE_NAME || "D Chin Mart";

const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dchinmart.com"
).replace(/\/+$/, "");

const canonicalPath = "/contact";
const pageUrl = `${siteUrl}${canonicalPath}`;
const ogImage = `${siteUrl}/og-default.png`;

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@dchinmart.com";

const supportPhone =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+8801923363194";

const formattedPhone =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY || "+880 1923-363194";

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: "Contact Us",

  description:
    "Contact D Chin Mart Bangladesh for order support, product inquiries, delivery updates, return help, EMI questions and customer service assistance.",

  keywords: [
    "contact D Chin Mart",
    "D Chin Mart support",
    "D Chin Mart customer service",
    "D Chin Mart contact number",
    "online shopping support Bangladesh",
    "order support Bangladesh",
    "EMI support Bangladesh",
  ],

  alternates: {
    canonical: canonicalPath,
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
    locale: "en_BD",
    url: pageUrl,
    siteName,
    title: `Contact Us | ${siteName} Bangladesh`,
    description:
      "Need help with orders, delivery, returns, products or EMI? Contact D Chin Mart Bangladesh customer support.",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: `Contact ${siteName} Bangladesh`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `Contact Us | ${siteName} Bangladesh`,
    description:
      "Contact D Chin Mart Bangladesh for order support, delivery help, returns, product inquiries and EMI assistance.",
    images: [ogImage],
  },
};

export default function ContactPage() {
  const contactPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${pageUrl}#contactpage`,
    name: `Contact ${siteName}`,
    url: pageUrl,
    description:
      "Contact D Chin Mart Bangladesh for customer support, order help, delivery updates, return support, product inquiries and EMI assistance.",
    inLanguage: "en-BD",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      name: siteName,
      url: siteUrl,
    },
    about: {
      "@type": "OnlineStore",
      "@id": `${siteUrl}#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      image: `${siteUrl}/og-default.png`,
      email: supportEmail,
      telephone: supportPhone,
      address: {
        "@type": "PostalAddress",
        addressCountry: "BD",
      },
      areaServed: {
        "@type": "Country",
        name: "Bangladesh",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: supportPhone,
          email: supportEmail,
          areaServed: "BD",
          availableLanguage: ["English", "Bengali"],
        },
        {
          "@type": "ContactPoint",
          contactType: "sales support",
          telephone: supportPhone,
          email: supportEmail,
          areaServed: "BD",
          availableLanguage: ["English", "Bengali"],
        },
      ],
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Contact Us",
        item: pageUrl,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "How can I contact D Chin Mart?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can contact D Chin Mart by phone at ${formattedPhone} or by email at ${supportEmail}.`,
        },
      },
      {
        "@type": "Question",
        name: "Can I contact D Chin Mart for order support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can contact D Chin Mart for order updates, delivery information, product questions and return support.",
        },
      },
      {
        "@type": "Question",
        name: "Does D Chin Mart provide EMI support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, D Chin Mart provides support for eligible EMI or installment product inquiries.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(contactPageJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(breadcrumbJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(faqJsonLd),
        }}
      />

      <h1 className="sr-only">
        Contact D Chin Mart Bangladesh - Customer Support, Order Help, Delivery,
        Returns and EMI Support
      </h1>

      <ContactClient />
    </>
  );
}