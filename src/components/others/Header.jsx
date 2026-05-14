"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Menu,
  ChevronDown,
  MapPin,
  Tag,
  Home,
  X,
  Loader2,
  Truck,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { useSession } from "next-auth/react";
import useWishlistStore from "@/lib/wishlistStore";
import HeaderSearchComponent from "@/components/others/AutoCompleteSearch";

import MobileBottomNav from "./header/MobileBottomNav";
import DesktopActions from "./header/DesktopActions";

const formatSlug = (name) => name.toLowerCase().replace(/\s/g, "-");

export function useWishlistWithSession() {
  const { status } = useSession();
  const store = useWishlistStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && !initialized) {
      store.fetchWishlist();
      setInitialized(true);
    }
    if (status === "unauthenticated" && initialized) {
      setInitialized(false);
    }
  }, [status, initialized, store]);

  return store;
}

const coreMenuLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/allproducts" },
  { name: "Contact", href: "/contact" },
];

const extendedLinks = [
  { name: "OFFERS", icon: Tag, href: "/offers" },
  { name: "OUR LOCATION", icon: MapPin, href: "/location" },
  { name: "VISIT OUR SHOWROOM", icon: MapPin, href: "/showroom" },
];

export default function EcommerceHeader() {
  const [activeTab, setActiveTab] = useState("menu");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState(null);

  const searchInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/categories", {
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        const { categories: data } = await response.json();
        setCategories(
          data.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug || formatSlug(item.name),
          })),
        );
        setCategoryError(null);
      } catch (error) {
        setCategoryError("Failed to load categories.");
        toast.error("Failed to load product categories.");
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const COLLAPSE_AT = 96;
    const EXPAND_AT = 10;
    let lastY = window.scrollY;

    const handleScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      lastY = y;
      if (goingDown && y > COLLAPSE_AT) setScrolled(true);
      else if (!goingDown && y < EXPAND_AT) setScrolled(false);
    };

    setScrolled(window.scrollY > COLLAPSE_AT);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      const inputElement = searchInputRef.current.querySelector("input");
      if (inputElement) setTimeout(() => inputElement.focus(), 50);
    }
  }, [mobileSearchOpen]);

  const handleNavigation = (href) => router.push(href);
  const closeMobileSearch = () => setMobileSearchOpen(false);

  const categoryContent = loadingCategories ? (
    <div className="flex justify-center items-center py-6 gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Loading…</span>
    </div>
  ) : categoryError ? (
    <div className="text-center text-destructive py-4 text-sm px-3">
      {categoryError}
    </div>
  ) : categories.length === 0 ? (
    <div className="text-center text-muted-foreground py-4 text-sm">
      No categories available.
    </div>
  ) : (
    categories.map((cat) => (
      <DropdownMenuItem
        key={cat.slug}
        className="text-sm uppercase tracking-wide font-medium hover:bg-primary/10 hover:text-primary cursor-pointer px-4 py-2.5 rounded-md transition-colors"
        onClick={() => handleNavigation(`/allproducts?categoryId=${cat.id}`)}
      >
        {cat.name}
      </DropdownMenuItem>
    ))
  );

  const mobileCategoryButtons = categories.map((cat) => (
    <SheetClose asChild key={cat.slug}>
      <Button
        variant="outline"
        className="justify-start truncate uppercase text-xs font-semibold tracking-wide hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
        onClick={() => handleNavigation(`/allproducts?categoryId=${cat.id}`)}
      >
        {cat.name}
      </Button>
    </SheetClose>
  ));

  return (
    <>
      {/* ═══════════════════════════════════════════════
          DESKTOP HEADER
      ═══════════════════════════════════════════════ */}
      <header className="hidden md:block w-full sticky top-0 z-[100]">
        {/* ── Top utility bar ── */}
        <div
          className={`
            w-full bg-primary text-secondary
            transition-all duration-300 ease-in-out origin-top
            ${
              scrolled
                ? "max-h-0 opacity-0 overflow-hidden py-0"
                : "max-h-[120px] opacity-100 overflow-visible py-4"
            }
          `}
          style={{
            boxShadow: scrolled
              ? "none"
              : "inset 0 -1px 0 hsl(var(--primary-foreground)/0.1)",
          }}
        >
          <div className="flex items-center justify-between px-6 lg:px-10 max-w-7xl mx-auto">
            {/* Logo */}
            <Link
              href="/"
              className="text-3xl font-extrabold text-primary-foreground tracking-tight shrink-0 hover:opacity-85 transition-opacity drop-shadow-sm"
            >
              ShopEase
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-xl mx-8">
              <HeaderSearchComponent
                placeholder="Search thousands of products…"
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 lg:gap-4 shrink-0">
              <DesktopActions />
            </div>
          </div>
        </div>

        {/* ── Bottom nav bar ── */}
        <div
          className={`
            w-full bg-primary
            border-t border-primary-foreground/10
            transition-all duration-300
            ${
              scrolled
                ? "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.5),0_2px_8px_-2px_hsl(var(--primary)/0.35)]"
                : "shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.3)]"
            }
          `}
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto px-6 h-12">
            {/* LEFT: logo (scroll-in) + categories */}
            <div className="flex items-center gap-0">
              <Link
                href="/"
                className={`
                  text-xl font-extrabold text-primary-foreground tracking-tight
                  transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap
                  hover:opacity-85
                  ${scrolled ? "max-w-[140px] opacity-100 mr-3" : "max-w-0 opacity-0 mr-0"}
                `}
              >
                ShopEase
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="
                      bg-primary-foreground text-primary text-sm font-bold
                      px-5 rounded-none h-12 shadow-none border-0
                      hover:bg-primary-foreground/90
                      transition-colors duration-150
                      disabled:opacity-60
                    "
                    disabled={loadingCategories}
                  >
                    {loadingCategories ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Menu className="h-4 w-4 mr-2" />
                    )}
                    All Categories
                    {!loadingCategories && (
                      <ChevronDown className="h-4 w-4 ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 mt-0 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15),0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-border bg-card rounded-xl p-1.5"
                  align="start"
                  sideOffset={0}
                >
                  {categoryContent}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* CENTER: nav links */}
            <nav>
              <ul className="flex gap-8 lg:gap-12 text-sm font-semibold text-primary-foreground">
                {coreMenuLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="relative py-4 inline-block hover:text-primary-foreground/75 transition-colors duration-150 group"
                    >
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary-foreground/70 transition-all duration-200 group-hover:w-full rounded-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* RIGHT: shipping badge */}
            <div className="hidden lg:flex items-center gap-1.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground/90 backdrop-blur-sm">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              Free Shipping Over $50
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          MOBILE HEADER
      ═══════════════════════════════════════════════ */}
      <header
        className={`
          md:hidden w-full bg-primary sticky top-0 z-50
          transition-all duration-300
          ${
            scrolled
              ? "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.55),0_2px_8px_-2px_hsl(var(--primary)/0.4)]"
              : "shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.35)]"
          }
        `}
      >
        {/* Subtle inner top highlight line */}
        <div className="absolute inset-x-0 top-0 h-px bg-primary-foreground/15 pointer-events-none" />

        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/15 rounded-xl h-9 w-9 transition-colors"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-full max-w-sm p-0 bg-background shadow-2xl"
              >
                {/* Sheet header with primary bg */}
                <SheetHeader className="px-5 py-4 bg-primary">
                  <SheetTitle className="text-xl font-extrabold text-primary-foreground tracking-tight drop-shadow-sm">
                    ShopEase
                  </SheetTitle>
                </SheetHeader>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 h-11 w-full rounded-none border-b border-border bg-muted/40 p-0">
                    <TabsTrigger
                      value="menu"
                      className="rounded-none h-full font-semibold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                    >
                      Menu
                    </TabsTrigger>
                    <TabsTrigger
                      value="categories"
                      className="rounded-none h-full font-semibold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                    >
                      Categories
                    </TabsTrigger>
                  </TabsList>

                  {/* Menu tab */}
                  <TabsContent value="menu" className="mt-0 px-4 py-2">
                    <ul className="space-y-0.5 py-2">
                      {coreMenuLinks.map((link) => (
                        <SheetClose asChild key={link.name}>
                          <li
                            className="flex items-center gap-3 text-base font-semibold text-foreground hover:bg-primary/8 hover:text-primary px-3 py-3 rounded-xl transition-colors cursor-pointer group"
                            onClick={() => handleNavigation(link.href)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Home className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            </div>
                            {link.name}
                          </li>
                        </SheetClose>
                      ))}
                    </ul>

                    <Separator className="my-3" />

                    <ul className="space-y-0.5">
                      {extendedLinks.map((link) => (
                        <SheetClose asChild key={link.name}>
                          <li
                            className="flex items-center gap-3 text-sm font-medium text-foreground hover:bg-primary/8 hover:text-primary px-3 py-2.5 rounded-xl transition-colors cursor-pointer group"
                            onClick={() => handleNavigation(link.href)}
                          >
                            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <link.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            </div>
                            {link.name}
                          </li>
                        </SheetClose>
                      ))}
                    </ul>

                    <Separator className="my-3" />

                    <div className="flex items-center gap-2.5 px-3 py-3 text-xs text-primary font-semibold bg-primary/8 border border-primary/20 rounded-xl">
                      <Truck className="h-4 w-4 shrink-0" />
                      Free Shipping on orders over $50
                    </div>
                  </TabsContent>

                  {/* Categories tab */}
                  <TabsContent value="categories" className="mt-0 px-4 py-3">
                    {loadingCategories ? (
                      <div className="flex justify-center items-center py-10 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground font-medium">
                          Loading…
                        </span>
                      </div>
                    ) : categoryError ? (
                      <div className="text-center text-destructive py-8 text-sm font-medium">
                        Failed to load categories.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCategoryButtons}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>

            <Link
              href="/"
              className="text-xl font-extrabold text-primary-foreground tracking-tight hover:opacity-85 transition-opacity drop-shadow-sm"
            >
              ShopEase
            </Link>
          </div>

          {/* Right: search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/15 rounded-xl h-9 w-9 transition-colors"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          MOBILE SEARCH OVERLAY
      ═══════════════════════════════════════════════ */}
      <div
        className={`
          fixed inset-0 z-[140] md:hidden
          transition-opacity duration-300
          ${
            mobileSearchOpen
              ? "opacity-100 visible bg-background/70 backdrop-blur-md"
              : "opacity-0 invisible"
          }
        `}
        onClick={closeMobileSearch}
        aria-hidden="true"
      />

      <div
        className={`
          fixed top-0 left-0 right-0 z-[150] md:hidden
          bg-primary
          shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.5),0_2px_12px_-2px_hsl(var(--primary)/0.4)]
          transition-transform duration-300 ease-out
          ${mobileSearchOpen ? "translate-y-0" : "-translate-y-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        {/* Inner highlight line */}
        <div className="absolute inset-x-0 top-0 h-px bg-primary-foreground/15 pointer-events-none" />
        <div className="flex items-center gap-2 px-4 py-3 max-w-4xl mx-auto">
          <div className="flex-1" ref={searchInputRef}>
            <HeaderSearchComponent
              placeholder="Search thousands of products…"
              className="w-full"
              isMobile={true}
              onClose={closeMobileSearch}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/15 rounded-xl h-9 w-9 shrink-0 transition-colors"
            onClick={closeMobileSearch}
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
