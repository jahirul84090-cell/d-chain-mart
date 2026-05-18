import ContactClient from "@/components/others/ContactClient";

const siteName = process.env.SITE_NAME || "BD Store";
const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://example.com"
).replace(/\/+$/, "");

const canonicalPath = "/contact";
const ogImage = `${siteUrl}/og-contact.png`; // put in /public/og-contact.png (1200x630)

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: "Contact Us",
  description:
    "Contact BD Store for support, order help, business inquiries, or feedback. We’ll reply as soon as possible.",

  alternates: { canonical: canonicalPath },

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
    url: `${siteUrl}${canonicalPath}`,
    siteName,
    title: "Contact Us | BD Store",
    description:
      "Need help? Contact BD Store support for orders, shipping, returns, or general questions.",
    images: [
      { url: ogImage, width: 1200, height: 630, alt: "Contact BD Store" },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Contact Us | BD Store",
    description:
      "Need help? Contact BD Store support for orders, shipping, returns, or general questions.",
    images: [ogImage],
  },
};

export default function ContactPage() {
  // ✅ JSON-LD (ContactPage + Organization)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Us",
    url: `${siteUrl}${canonicalPath}`,
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
    about: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
      email: "support@bdstore.com",
      telephone: "+8801XXXXXXXXX",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Dinajpur, Rangpur",
        addressLocality: "Dinajpur",
        addressCountry: "BD",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactClient />
    </>
  );
}
