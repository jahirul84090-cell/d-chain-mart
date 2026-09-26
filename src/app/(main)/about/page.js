import Link from "next/link";
import {
  BadgeCheck,
  CreditCard,
  Headphones,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { toJsonLd } from "@/lib/jsonld";

export const metadata = {
  title: "About Us – Online Electronics Shop in Bangladesh",
  description: `Learn about ${SITE_NAME} — a Bangladeshi online store for mobiles, laptops, electronics and accessories with cash on delivery, EMI and fast delivery nationwide.`,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/about`,
    title: `About Us | ${SITE_NAME}`,
    description: `Why thousands of shoppers in Bangladesh trust ${SITE_NAME}.`,
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630 }],
  },
};

const values = [
  {
    icon: BadgeCheck,
    title: "Genuine products",
    text: "Every product we sell is sourced from trusted brands and authorised suppliers.",
  },
  {
    icon: Truck,
    title: "Delivery across Bangladesh",
    text: "Fast, tracked delivery to your door, in Dhaka and nationwide.",
  },
  {
    icon: Wallet,
    title: "Cash on delivery",
    text: "Pay when your order arrives. No advance payment needed.",
  },
  {
    icon: CreditCard,
    title: "Easy EMI",
    text: "Buy now and pay in simple monthly installments with transparent terms.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    text: "Your account and payment details are protected at every step.",
  },
  {
    icon: Headphones,
    title: "Real support",
    text: "Our team helps with orders, delivery, returns and EMI questions.",
  },
];

export default function AboutPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "About Us", item: `${SITE_URL}/about` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />

      <section className="bg-gradient-to-br from-sky-50 to-white">
        <div className="container mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            About {SITE_NAME}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Shopping made simple, safe and affordable
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            {SITE_NAME} is an online store built for shoppers in Bangladesh. We bring
            you mobiles, laptops, electronics and everyday essentials at fair
            prices, with cash on delivery and flexible EMI so you can buy what you
            need today.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Why shop with us
        </h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container mx-auto max-w-5xl px-4 pb-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-900 px-6 py-10 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold">Ready to start shopping?</h2>
          <p className="max-w-xl text-gray-300">
            Browse our full catalogue or get in touch. We&apos;re happy to help you
            find the right product.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/allproducts"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Shop all products
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
