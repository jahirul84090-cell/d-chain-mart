import Banner from "@/components/HomePage/Banner/Banner";
import CategoryCardSkeleton from "@/components/HomePage/Categories/CategorySkeleton";
import TopCategories from "@/components/HomePage/Categories/TopCategories";
import CatProduct from "@/components/HomePage/CatProduct/CatProduct";
import DealsOfDay from "@/components/HomePage/DealsOfDay/DealsOfDay";
import DealsOfDaySkeleton from "@/components/HomePage/DealsOfDay/DealsOfDaySkeleton";

import FeatureProduct from "@/components/HomePage/FeaturedProduct/FeatureProduct";
import FeatureProductSkeleton from "@/components/HomePage/FeaturedProduct/FeatureProductSkeleton";

import NewArrivals from "@/components/HomePage/NewArrivals/NewArrivals";
import NewArrivalsSkeleton from "@/components/HomePage/NewArrivals/NewArrivalsSkeleton";

import React, { Suspense } from "react";

const siteName = process.env.SITE_NAME || "D Chin Mart";
const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dchinmart.com"
).replace(/\/+$/, "");

export const metadata = {
  title:
    "D Chin Mart | Online Shopping for Mobiles & Electronics",

  description:
    "Shop mobiles, laptops, electronics, accessories and more at D Chin Mart Bangladesh. Fast delivery, secure checkout, cash on delivery and EMI facilities available.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title:
      "D Chin Mart | Online Shopping for Mobiles & Electronics",
    description:
      "Buy mobiles, laptops, electronics and accessories online in Bangladesh with COD, secure checkout and EMI facilities.",
    url: siteUrl,
    type: "website",
    images: [
      {
        url: `${siteUrl}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "D Chin Mart Bangladesh Online Shopping",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "D Chin Mart Bangladesh | Online Shopping for Mobiles, Laptops & Electronics",
    description:
      "Buy mobiles, laptops, electronics and accessories online in Bangladesh with COD and EMI facilities.",
    images: [`${siteUrl}/og-default.png`],
  },

  keywords: [
    "D Chin Mart",
    "online shopping Bangladesh",
    "mobile price in Bangladesh",
    "laptop price in Bangladesh",
    "electronics shop Bangladesh",
    "EMI shopping Bangladesh",
    "buy now pay later Bangladesh",
  ],
};

const Page = async () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is cash on delivery available at D Chin Mart?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, cash on delivery is available for eligible products and selected delivery areas in Bangladesh.",
        },
      },
      {
        "@type": "Question",
        name: "Does D Chin Mart offer EMI facilities?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, D Chin Mart offers EMI facilities for eligible products through its loan or installment system.",
        },
      },
      {
        "@type": "Question",
        name: "What products can I buy from D Chin Mart?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can shop mobiles, laptops, electronics, accessories and other selected products from D Chin Mart.",
        },
      },
      {
        "@type": "Question",
        name: "How long does delivery take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Delivery time usually depends on the product, seller and customer location. Most orders are processed as quickly as possible.",
        },
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <h1 className="sr-only">
        D Chin Mart Bangladesh - Online Shopping for Mobiles, Laptops,
        Electronics and EMI Products
      </h1>

      <Suspense fallback={<CategoryCardSkeleton />}>
        <TopCategories />
      </Suspense>

      <Banner />

      <Suspense fallback={<NewArrivalsSkeleton />}>
        <NewArrivals />
      </Suspense>

      <Suspense fallback={<FeatureProductSkeleton />}>
        <FeatureProduct />
      </Suspense>

      <Suspense fallback={<DealsOfDaySkeleton />}>
        <DealsOfDay />
      </Suspense>

      <CatProduct />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Online Shopping in Bangladesh with D Chin Mart
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-700">
            D Chin Mart is an online shopping platform in Bangladesh where
            customers can buy mobiles, laptops, electronics, accessories and
            other quality products at competitive prices. Our goal is to make
            online shopping simple, reliable and affordable for customers across
            Bangladesh.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-700">
            Customers can browse products, compare prices, check product
            details and place orders securely from D Chin Mart. We focus on
            fast order processing, secure checkout, cash on delivery support and
            EMI facilities for eligible products.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-700">
            Whether you are looking for the latest mobile phone price in
            Bangladesh, a laptop for study or office work, useful electronic
            accessories, or buy now pay later shopping options, D Chin Mart
            helps you find suitable products in one place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-gray-50 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Is cash on delivery available?
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Yes, cash on delivery is available for eligible products and
                selected delivery areas in Bangladesh.
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Does D Chin Mart offer EMI?
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Yes, eligible products can be purchased through EMI or
                installment facilities.
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                What products are available?
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                D Chin Mart offers mobiles, laptops, electronics, accessories
                and other selected products.
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                How long does delivery take?
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Delivery time depends on customer location and product
                availability. Orders are processed as quickly as possible.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Page;