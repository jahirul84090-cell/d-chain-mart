import React from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  BadgeCheck,
  MessageCircle,
  Headphones,
  Smartphone,
  Laptop,
  Watch,
  PackageCheck,
  WalletCards,
  ShoppingBag,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toJsonLd } from "@/lib/jsonld";

const siteName = process.env.SITE_NAME || "D Chin Mart";

const siteUrl = (
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dchinmart.com"
).replace(/\/+$/, "");

const phoneNumber = "01923363194";
const phoneHref = "tel:+8801923363194";
const whatsappHref = "https://wa.me/8801923363194";
const supportEmail = "dchinmart@gmail.com";

const getCategories = async () => {
  try {
    return await prisma.category.findMany({
      where: {
        products: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: 8,
    });
  } catch (error) {
    console.error("Footer category fetch error:", error);
    return [];
  }
};

const getCategoryIcon = (name = "") => {
  const value = name.toLowerCase();

  if (value.includes("mobile") || value.includes("phone")) return Smartphone;
  if (value.includes("laptop") || value.includes("computer")) return Laptop;
  if (value.includes("watch")) return Watch;
  if (
    value.includes("headphone") ||
    value.includes("earphone") ||
    value.includes("accessor")
  )
    return Headphones;

  return ShoppingBag;
};

const Footer = async () => {
  const year = new Date().getFullYear();
  const categories = await getCategories();

  const shopLinks = [
    { label: "All Products", href: "/allproducts", icon: PackageCheck },
    ...categories.map((category) => ({
      label: category.name,
      href: `/category/${category.slug}`,
      icon: getCategoryIcon(category.name),
      count: category._count.products,
    })),
    { label: "New Arrivals", href: "/allproducts?sort=newest", icon: PackageCheck },
    { label: "Best Deals", href: "/allproducts?sort=deals", icon: WalletCards },
  ];

  const customerLinks = [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Track Order", href: "/track-order" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Return Policy", href: "/return-policy" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "EMI Policy", href: "/emi-policy" },
  ];

  const companyLinks = [
    { label: "About Us", href: "/about-us" },
    { label: "Blog", href: "/blog" },
    { label: "Loan Policy", href: "/loan-policy" },
    { label: "Apply for EMI", href: "/loans/apply" },
    { label: "My Orders", href: "/orders" },
    { label: "My Account", href: "/account" },
  ];

  const trustItems = [
    { title: "Secure Checkout", subtitle: "Safe payment", icon: ShieldCheck },
    { title: "Cash on Delivery", subtitle: "Selected areas", icon: BadgeCheck },
    { title: "Nationwide Delivery", subtitle: "Across Bangladesh", icon: Truck },
    { title: "Easy Return", subtitle: "Simple return policy", icon: RotateCcw },
    { title: "EMI Available", subtitle: "Buy now, pay later", icon: CreditCard },
  ];

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${siteUrl}#organization`,
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
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: "+8801923363194",
        email: supportEmail,
        areaServed: "BD",
        availableLanguage: ["English", "Bengali"],
      },
    ],
  };

  return (
    <footer className="relative overflow-hidden bg-[#07111f] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(organizationJsonLd),
        }}
      />

      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[#2ea7f2]/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <section className="relative border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#2ea7f2]/50 hover:bg-[#2ea7f2]/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2ea7f2]/15 text-[#2ea7f2]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link
              href="/"
              aria-label={`${siteName} home`}
              className="inline-flex text-3xl font-black tracking-tight text-white"
            >
              {siteName}
            </Link>

            <p className="mt-2 text-sm font-semibold text-[#2ea7f2]">
              Online Shopping & EMI Marketplace in Bangladesh
            </p>

            <h2 className="sr-only">Online Shopping in Bangladesh</h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              D Chin Mart is a trusted online shopping platform in Bangladesh
              for mobiles, laptops, electronics, accessories and EMI shopping.
              Shop quality products with secure checkout, cash on delivery and
              nationwide delivery.
            </p>

            <div className="mt-6 rounded-3xl border border-[#2ea7f2]/20 bg-[#2ea7f2]/10 p-5">
              <p className="text-sm font-bold text-white">Need help?</p>

              <p className="mt-1 text-sm text-slate-300">
                Contact our support team before placing an order.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>

                <a
                  href={phoneHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:border-[#2ea7f2]/60 hover:text-[#2ea7f2]"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#2ea7f2]" />
                <span>Bangladesh</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-[#2ea7f2]" />
                <a href={phoneHref} className="transition hover:text-[#2ea7f2]">
                  {phoneNumber}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-[#2ea7f2]" />
                <a
                  href={`mailto:${supportEmail}`}
                  className="transition hover:text-[#2ea7f2]"
                >
                  {supportEmail}
                </a>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              {[
                {
                  label: "Facebook",
                  href: "https://facebook.com",
                  icon: Facebook,
                },
                {
                  label: "Instagram",
                  href: "https://instagram.com",
                  icon: Instagram,
                },
                {
                  label: "YouTube",
                  href: "https://youtube.com",
                  icon: Youtube,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${siteName} ${item.label}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition hover:border-[#2ea7f2] hover:bg-[#2ea7f2]/10 hover:text-[#2ea7f2]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-base font-extrabold text-white">
              Shop Categories
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {shopLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300 transition hover:border-[#2ea7f2]/50 hover:bg-[#2ea7f2]/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#2ea7f2]" />

                    <span className="flex-1">{link.label}</span>

                    {typeof link.count === "number" && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {link.count}
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-[#2ea7f2]" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-base font-extrabold text-white">
              Customer Service
            </h3>

            <ul className="mt-5 space-y-3">
              {customerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-sm text-slate-300 transition hover:text-[#2ea7f2]"
                  >
                    <ChevronRight className="mr-2 h-4 w-4 text-[#2ea7f2] transition group-hover:translate-x-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-base font-extrabold text-white">Company</h3>

            <ul className="mt-5 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-sm text-slate-300 transition hover:text-[#2ea7f2]"
                  >
                    <ChevronRight className="mr-2 h-4 w-4 text-[#2ea7f2] transition group-hover:translate-x-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2ea7f2]/15 text-[#2ea7f2]">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div>
                  <h4 className="font-bold text-white">Buy Now, Pay Later</h4>
                  <p className="text-xs text-slate-400">EMI available</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                Eligible products can be purchased with EMI or installment
                facilities from D Chin Mart.
              </p>

              <Link
                href="/allproducts"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#2ea7f2] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1b92dc]"
              >
                Apply for EMI
              </Link>
            </div>
          </div>
        </div>
      </section>

     <section className="relative border-t border-white/10 bg-black/20">
  <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between lg:px-8">
    <p>
      © {year} {siteName}. All rights reserved.
    </p>

    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <Link
        href="/privacy-policy"
        className="transition hover:text-[#2ea7f2]"
      >
        Privacy Policy
      </Link>

      <Link
        href="/terms-and-conditions"
        className="transition hover:text-[#2ea7f2]"
      >
        Terms & Conditions
      </Link>

      <Link
        href="/return-policy"
        className="transition hover:text-[#2ea7f2]"
      >
        Return Policy
      </Link>
    </div>

    <div className="text-slate-400">
      Developed by{" "}
      <a
        href="https://www.facebook.com/jahirulislam.emon.18"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[#2ea7f2] hover:underline"
      >
        jahirul Islam Emon
      </a>
    </div>
  </div>
</section>
    </footer>
  );
};

export default Footer;