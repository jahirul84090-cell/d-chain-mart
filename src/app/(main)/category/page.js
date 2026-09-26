import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Grid3X3,
  ArrowRight,
  PackageCheck,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { toJsonLd } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

const siteName = process.env.SITE_NAME || "D Chin Mart";

const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dchinmart.com"
).replace(/\/+$/, "");

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: "Shop by Category",

  description:
    "Browse product categories at D Chin Mart Bangladesh. Shop mobiles, laptops, electronics, accessories and more with COD and EMI facilities.",

  keywords: [
    "D Chin Mart categories",
    "shop by category Bangladesh",
    "mobile category Bangladesh",
    "laptop category Bangladesh",
    "electronics category Bangladesh",
    "online shopping Bangladesh",
    "EMI shopping Bangladesh",
  ],

  alternates: {
    canonical: "/category",
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
    url: `${siteUrl}/category`,
    siteName,
    title: `Shop by Category | ${siteName} Bangladesh`,
    description:
      "Explore all product categories at D Chin Mart Bangladesh including mobiles, laptops, electronics and accessories.",
    images: [
      {
        url: `${siteUrl}/og-default.png`,
        width: 1200,
        height: 630,
        alt: `${siteName} Product Categories`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `Shop by Category | ${siteName} Bangladesh`,
    description:
      "Browse product categories at D Chin Mart Bangladesh with COD and EMI facilities.",
    images: [`${siteUrl}/og-default.png`],
  },
};

const getCategories = async () => {
  return await prisma.category.findMany({
    where: {
      products: {
        some: {
          isActive: true,
        },
      },
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

export default async function CategoryPage() {
  const categories = await getCategories();

  const pageUrl = `${siteUrl}/category`;

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
        name: "Categories",
        item: pageUrl,
      },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#collectionpage`,
    name: `Shop by Category | ${siteName}`,
    url: pageUrl,
    description:
      "Browse product categories at D Chin Mart Bangladesh including mobiles, laptops, electronics and accessories.",
    inLanguage: "en-BD",
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
    },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#itemlist`,
    name: `${siteName} Product Categories`,
    url: pageUrl,
    numberOfItems: categories.length,
    itemListElement: categories.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: category.name,
      url: `${siteUrl}/category/${category.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(breadcrumbJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(collectionJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(itemListJsonLd),
        }}
      />

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#07111f] p-8 text-white shadow-xl sm:p-10 lg:p-12">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2ea7f2]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2ea7f2]/30 bg-[#2ea7f2]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#2ea7f2]">
                <Grid3X3 className="h-4 w-4" />
                Shop Categories
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Browse Products by Category
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Explore product categories at D Chin Mart Bangladesh. Find
                mobiles, laptops, electronics, accessories and more with secure
                checkout, cash on delivery and EMI facilities.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <PackageCheck className="h-5 w-5 text-[#2ea7f2]" />
                  <p className="mt-2 text-sm font-bold">Active Products</p>
                  <p className="text-xs text-slate-400">Updated category list</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <ShoppingBag className="h-5 w-5 text-[#2ea7f2]" />
                  <p className="mt-2 text-sm font-bold">Easy Shopping</p>
                  <p className="text-xs text-slate-400">Find products faster</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Sparkles className="h-5 w-5 text-[#2ea7f2]" />
                  <p className="mt-2 text-sm font-bold">Best Deals</p>
                  <p className="text-xs text-slate-400">Latest collections</p>
                </div>
              </div>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                No Categories Found
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                No active product categories are available right now.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#2ea7f2]/40 hover:shadow-xl"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2ea7f2]/10 text-[#2ea7f2] transition group-hover:bg-[#2ea7f2] group-hover:text-white">
                    <ShoppingBag className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 text-xl font-extrabold text-slate-900">
                    {category.name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Browse {category.name} products available at {siteName}.
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {category._count.products} products
                    </span>

                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#2ea7f2]">
                      View
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <section className="mt-10 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-slate-900">
              Shop Online by Category in Bangladesh
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              D Chin Mart helps customers in Bangladesh browse products by
              category, compare available items and order online easily. You can
              explore mobiles, laptops, electronics, accessories and more from
              one place with secure checkout, cash on delivery and EMI support
              for eligible products.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}