import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CreditCard,
  PackageSearch,
  ShoppingBag,
  Star,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { productListJsonLd, toJsonLd } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

const PRODUCTS_PER_PAGE = 24;

const siteName = process.env.SITE_NAME || "D Chin Mart";

const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dchinmart.com"
).replace(/\/+$/, "");

const formatPrice = (price) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("en-BD");
};

const makeAbsoluteUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${siteUrl}${url}`;
  return `${siteUrl}/${url}`;
};

// Main image first; relative paths stay relative for <Image>.
const getProductImage = (product) =>
  product?.mainImage || product?.images?.[0]?.url || "/placeholder.png";

const getCategory = async (slug, page) => {
  const skip = (page - 1) * PRODUCTS_PER_PAGE;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
    },
  });

  if (!category) return null;

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: PRODUCTS_PER_PAGE,
    }),

    prisma.product.count({
      where: {
        categoryId: category.id,
        isActive: true,
      },
    }),
  ]);

  return {
    ...category,
    products,
    totalProducts,
    totalPages: Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE)),
    currentPage: page,
  };
};

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;

  const page = Math.max(1, Number(query?.page) || 1);

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      imageUrl: true,
    },
  });

  if (!category) {
    return {
      title: "Category Not Found",
      description: "The category you are looking for does not exist.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    page > 1
      ? `${category.name} Price in Bangladesh - Page ${page}`
      : `${category.name} Price in Bangladesh`;

  const description = `Shop ${category.name} products online at ${siteName} Bangladesh. Find latest prices, best deals, cash on delivery and EMI facilities.`;

  const canonical =
    page > 1
      ? `/category/${category.slug}?page=${page}`
      : `/category/${category.slug}`;

  const ogImage = makeAbsoluteUrl(category.imageUrl) || `${siteUrl}/og-default.png`;

  return {
    metadataBase: new URL(siteUrl),

    title,

    description,

    keywords: [
      category.name,
      `${category.name} price in Bangladesh`,
      `${category.name} online shopping Bangladesh`,
      `buy ${category.name} online`,
      `${category.name} cash on delivery Bangladesh`,
      `${category.name} EMI Bangladesh`,
      siteName,
    ],

    alternates: {
      canonical,
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
      url: `${siteUrl}${canonical}`,
      siteName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${category.name} Price in Bangladesh`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export async function generateStaticParams() {
  // If the database is unreachable at build time, render categories on
  // first request instead of failing the whole deploy.
  try {
    const categories = await prisma.category.findMany({ select: { slug: true } });
    return categories.map((category) => ({ slug: category.slug }));
  } catch (error) {
    console.error("category generateStaticParams failed:", error.message);
    return [];
  }
}

export default async function CategoryProductsPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;

  const page = Math.max(1, Number(query?.page) || 1);

  const category = await getCategory(slug, page);

  if (!category) {
    notFound();
  }

  if (page > category.totalPages && category.totalProducts > 0) {
    notFound();
  }

  const pageUrl =
    page > 1
      ? `${siteUrl}/category/${category.slug}?page=${page}`
      : `${siteUrl}/category/${category.slug}`;

  const getPageHref = (pageNumber) =>
    pageNumber <= 1
      ? `/category/${category.slug}`
      : `/category/${category.slug}?page=${pageNumber}`;

  const visiblePages = Array.from(
    { length: category.totalPages },
    (_, index) => index + 1
  ).filter(
    (pageNumber) =>
      pageNumber === 1 ||
      pageNumber === category.totalPages ||
      Math.abs(pageNumber - page) <= 1
  );

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
        item: `${siteUrl}/category`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${siteUrl}/category/${category.slug}`,
      },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#collectionpage`,
    name:
      page > 1
        ? `${category.name} Price in Bangladesh - Page ${page}`
        : `${category.name} Price in Bangladesh`,
    url: pageUrl,
    description: `Shop ${category.name} products online at ${siteName} Bangladesh.`,
    inLanguage: "en-BD",
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
    },
  };

  const itemListJsonLd = productListJsonLd({
    products: category.products,
    pageUrl,
    name: `${category.name} Products`,
    offset: (page - 1) * PRODUCTS_PER_PAGE,
  });


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

      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }}
        />
      )}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/category"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#2ea7f2]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Link>

          <div className="relative overflow-hidden rounded-[2rem] bg-[#07111f] p-8 text-white shadow-xl sm:p-10 lg:p-12">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2ea7f2]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2ea7f2]/30 bg-[#2ea7f2]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#2ea7f2]">
                <ShoppingBag className="h-4 w-4" />
                Product Category
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                {category.name} Price in Bangladesh
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Shop {category.name} products online at {siteName} Bangladesh.
                Find latest products, best prices, secure checkout, cash on
                delivery and EMI facilities.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <BadgeCheck className="h-5 w-5 text-[#2ea7f2]" />
                  <p className="mt-2 text-sm font-bold">
                    {category.totalProducts} Products
                  </p>
                  <p className="text-xs text-slate-400">
                    Showing {category.products.length} on this page
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Truck className="h-5 w-5 text-[#2ea7f2]" />
                  <p className="mt-2 text-sm font-bold">Fast Delivery</p>
                  <p className="text-xs text-slate-400">Across Bangladesh</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <CreditCard className="h-5 w-5 text-[#2ea7f2]" />
                  <p className="mt-2 text-sm font-bold">EMI Available</p>
                  <p className="text-xs text-slate-400">Eligible products</p>
                </div>
              </div>
            </div>
          </div>

          {category.products.length === 0 ? (
            <div className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#2ea7f2]/10 text-[#2ea7f2]">
                <PackageSearch className="h-10 w-10" />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-900">
                No Products Found
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                No active products are available in this category right now.
              </p>

              <Link
                href="/allproducts"
                className="mt-6 inline-flex rounded-xl bg-[#2ea7f2] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1b92dc]"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8 flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Showing{" "}
                  <span className="text-slate-950">
                    {(page - 1) * PRODUCTS_PER_PAGE + 1}-
                    {Math.min(page * PRODUCTS_PER_PAGE, category.totalProducts)}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-950">
                    {category.totalProducts}
                  </span>{" "}
                  products
                </p>

                <p className="text-sm font-semibold text-slate-500">
                  Page {page} of {category.totalPages}
                </p>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {category.products.map((product) => {
                  const imageUrl = getProductImage(product);

                  return (
                    <article
                      key={product.id}
                      className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#2ea7f2]/40 hover:shadow-xl"
                    >
                      <Link href={`/${product.slug}`}>
                        <div className="relative aspect-square overflow-hidden bg-slate-100">
                          <Image
                            src={imageUrl}
                            alt={`${product.name} price in Bangladesh`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />

                          {product.isNewArrival ? (
                            <div className="absolute left-3 top-3 rounded-full bg-[#2ea7f2] px-3 py-1 text-xs font-bold text-white">
                              NEW
                            </div>
                          ) : product.discount > 0 ? (
                            <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                              -{product.discount}%
                            </div>
                          ) : null}
                        </div>
                      </Link>

                      <div className="p-5">
                        <Link href={`/${product.slug}`}>
                          <h2 className="line-clamp-2 min-h-[3.5rem] text-base font-extrabold leading-7 text-slate-900 transition group-hover:text-[#2ea7f2]">
                            {product.name}
                          </h2>
                        </Link>


                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Price
                            </p>
                            <p className="text-xl font-black text-[#2ea7f2]">
                              ৳ {formatPrice(product.price)}
                            </p>
                          </div>

                          <Link
                            href={`/${product.slug}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-[#2ea7f2] hover:text-white"
                            aria-label={`View ${product.name}`}
                          >
                            <ArrowRight className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {category.totalPages > 1 && (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-center gap-2"
                  aria-label="Category pagination"
                >
                  {page > 1 && (
                    <Link
                      href={getPageHref(page - 1)}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#2ea7f2] hover:text-[#2ea7f2]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Link>
                  )}

                  {visiblePages.map((pageNumber, index) => {
                    const previousPage = visiblePages[index - 1];

                    return (
                      <div key={pageNumber} className="flex items-center gap-2">
                        {previousPage && pageNumber - previousPage > 1 && (
                          <span className="px-2 text-sm font-bold text-slate-400">
                            ...
                          </span>
                        )}

                        <Link
                          href={getPageHref(pageNumber)}
                          className={
                            pageNumber === page
                              ? "inline-flex h-11 min-w-11 items-center justify-center rounded-xl bg-[#2ea7f2] px-4 text-sm font-black text-white shadow-sm"
                              : "inline-flex h-11 min-w-11 items-center justify-center rounded-xl border bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#2ea7f2] hover:text-[#2ea7f2]"
                          }
                        >
                          {pageNumber}
                        </Link>
                      </div>
                    );
                  })}

                  {page < category.totalPages && (
                    <Link
                      href={getPageHref(page + 1)}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#2ea7f2] hover:text-[#2ea7f2]"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}

          <section className="mt-10 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-slate-900">
              Buy {category.name} Online in Bangladesh
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              D Chin Mart offers {category.name} products for customers in
              Bangladesh. You can browse latest products, compare prices, check
              product details and order online with secure checkout, cash on
              delivery and EMI support for eligible products.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">Latest Products</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Browse updated {category.name} products and compare options.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">Secure Checkout</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Order online with a simple and secure checkout process.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">EMI Support</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Eligible products may support installment or EMI facilities.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}