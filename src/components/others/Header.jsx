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

  // ── Fetch categories ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/categories", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        const { categories: data } = await response.json();

        // FIX: preserve `id` alongside name & slug so navigation works
        const categoryNames = data.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug || formatSlug(item.name),
        }));

        setCategories(categoryNames);
        setCategoryError(null);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategoryError("Failed to load categories.");
        toast.error("Failed to load product categories.");
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  // ── Scroll detection with hysteresis (no flicker at threshold) ───────────
  // Collapse when scrolled DOWN past the utility bar height (~96px).
  // Only expand again when user scrolls back UP near the very top (<10px).
  // This prevents the toggle-loop that happens with a single `scrollY > 50` check.
  useEffect(() => {
    const COLLAPSE_AT = 96; // px — must scroll past this to collapse
    const EXPAND_AT = 10; // px — must return this close to top to expand

    let lastY = window.scrollY;

    const handleScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      lastY = y;

      if (goingDown && y > COLLAPSE_AT) {
        setScrolled(true);
      } else if (!goingDown && y < EXPAND_AT) {
        setScrolled(false);
      }
      // In the band between EXPAND_AT and COLLAPSE_AT: do nothing — no flicker.
    };

    // Set correct initial state without animation
    setScrolled(window.scrollY > COLLAPSE_AT);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Auto-focus mobile search input ───────────────────────────────────────
  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      const inputElement = searchInputRef.current.querySelector("input");
      if (inputElement) {
        setTimeout(() => inputElement.focus(), 50);
      }
    }
  }, [mobileSearchOpen]);

  const handleNavigation = (href) => router.push(href);
  const closeMobileSearch = () => setMobileSearchOpen(false);

  // ── Desktop category dropdown items ──────────────────────────────────────
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
        className="text-sm uppercase tracking-wide font-medium hover:bg-accent cursor-pointer px-4 py-2.5 rounded-md transition-colors"
        onClick={() => handleNavigation(`/allproducts?categoryId=${cat.id}`)}
      >
        {cat.name}
      </DropdownMenuItem>
    ))
  );

  // ── Mobile category buttons ───────────────────────────────────────────────
  const mobileCategoryButtons = categories.map((cat) => (
    <SheetClose asChild key={cat.slug}>
      <Button
        variant="outline"
        className="justify-start truncate uppercase text-xs font-semibold tracking-wide"
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
        {/* ── Top utility bar (logo + search + actions) ── */}
        <div
          className={`
            w-full bg-primary
            transition-all duration-300 ease-in-out origin-top
            ${
              scrolled
                ? "max-h-0 opacity-0 overflow-hidden py-0"
                : "max-h-[120px] opacity-100 overflow-visible py-4"
            }
          `}
        >
          <div className="flex items-center justify-between px-6 lg:px-10 max-w-7xl mx-auto">
            {/* Logo */}
            <Link
              href="/"
              className="text-3xl font-extrabold text-primary-foreground tracking-tight shrink-0 hover:opacity-90 transition-opacity"
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

        {/* ── Bottom nav bar (always visible) ── */}
        <div
          className={`
            w-full bg-primary/95 border-t border-primary-foreground/20
            transition-shadow duration-300
            ${scrolled ? "shadow-lg shadow-primary/40" : ""}
          `}
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto px-6 h-12">
            {/* LEFT: inline logo (only visible when scrolled) + categories */}
            <div className="flex items-center gap-4">
              {/* Logo appears in nav bar after scroll */}
              <Link
                href="/"
                className={`
                  text-xl font-extrabold text-primary-foreground tracking-tight
                  transition-all duration-300 ease-in-out overflow-hidden
                  ${scrolled ? "max-w-[140px] opacity-100 mr-2" : "max-w-0 opacity-0"}
                `}
              >
                ShopEase
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="bg-primary-foreground text-primary text-sm font-semibold px-5 rounded-none h-12 hover:bg-accent transition-colors shadow-none"
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
                  className="w-56 mt-1 shadow-xl border border-border bg-card rounded-lg p-1"
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
                      className="relative py-4 hover:text-primary-foreground/75 transition-colors duration-150 group"
                    >
                      {link.name}
                      {/* underline hover effect */}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-foreground/60 transition-all duration-200 group-hover:w-full rounded-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* RIGHT: shipping badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-primary-foreground/80">
              <Truck className="h-4 w-4" />
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
          transition-shadow duration-300
          ${scrolled ? "shadow-xl shadow-primary/40" : "shadow-md"}
        `}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/10 rounded-full"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-full max-w-sm p-0 bg-background"
              >
                <SheetHeader className="px-5 py-4 border-b border-border">
                  <SheetTitle className="text-xl font-bold text-primary">
                    ShopEase
                  </SheetTitle>
                </SheetHeader>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 h-11 w-full rounded-none border-b border-border bg-muted/50 p-0">
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
                            className="flex items-center gap-3 text-base font-semibold text-foreground hover:bg-accent px-3 py-3 rounded-lg transition-colors cursor-pointer"
                            onClick={() => handleNavigation(link.href)}
                          >
                            <Home className="h-4 w-4 text-muted-foreground shrink-0" />
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
                            className="flex items-center gap-3 text-sm font-medium text-foreground hover:bg-accent px-3 py-2.5 rounded-lg transition-colors cursor-pointer"
                            onClick={() => handleNavigation(link.href)}
                          >
                            <link.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            {link.name}
                          </li>
                        </SheetClose>
                      ))}
                    </ul>

                    <Separator className="my-3" />

                    <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground font-medium bg-muted/50 rounded-lg">
                      <Truck className="h-4 w-4 shrink-0" />
                      Free Shipping on orders over $50
                    </div>
                  </TabsContent>

                  {/* Categories tab */}
                  <TabsContent value="categories" className="mt-0 px-4 py-2">
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
                      <div className="grid grid-cols-2 gap-2 py-3">
                        {mobileCategoryButtons}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>

            <Link
              href="/"
              className="text-2xl font-extrabold text-primary-foreground tracking-tight hover:opacity-90 transition-opacity"
            >
              ShopEase
            </Link>
          </div>

          {/* Right: search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 rounded-full"
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
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-[140] md:hidden
          transition-opacity duration-300
          ${
            mobileSearchOpen
              ? "opacity-100 visible bg-background/80 backdrop-blur-sm"
              : "opacity-0 invisible"
          }
        `}
        onClick={closeMobileSearch}
        aria-hidden="true"
      />

      {/* Search panel */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-[150] md:hidden
          bg-card border-b border-border shadow-xl
          transition-transform duration-300 ease-out
          ${mobileSearchOpen ? "translate-y-0" : "-translate-y-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
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
            className="text-foreground hover:bg-muted rounded-full shrink-0"
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
