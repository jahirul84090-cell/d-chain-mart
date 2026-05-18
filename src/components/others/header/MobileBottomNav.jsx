"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Heart,
  ShoppingCart,
  User,
  Home,
  Layers3,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCartWithSession } from "@/lib/cartStore";
import { useWishlistWithSession } from "../Header";
import AccountDropdownContent, {
  AvatarLetterFallback,
} from "./AccountDropdownContent";

const mobileNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "shop", icon: Layers3, href: "/allproducts" },
  { label: "Wishlist", icon: Heart, href: "/wishlist" },
  { label: "Cart", icon: ShoppingCart, href: "/cart" },
  { label: "Account", icon: User, href: "/profile" },
];

const MOBILE_ACTION_CLASS =
  "h-14 w-full flex-1 flex flex-col items-center justify-center relative transition-colors duration-200";

const MobileActionItem = ({ icon: Icon, label, href }) => {
  const pathname = usePathname();
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href) &&
        (pathname.length === href.length || pathname[href.length] === "/");

  const { data: session, status } = useSession();
  const { cartItems } = useCartWithSession();
  const { wishlist } = useWishlistWithSession();

  const [imageError, setImageError] = useState(false);

  // ✅ Your nav data uses "/profile" but your old check used "/account"
  const isAccount = href === "/profile";

  let ItemIcon = Icon;
  let buttonLabel = label;
  let count = 0;

  const userImage = useMemo(
    () =>
      session?.user?.image && session.user.image.trim() !== ""
        ? session.user.image
        : null,
    [session]
  );

  useEffect(() => {
    if (isAccount && status !== "authenticated") {
      setImageError(false);
    }
  }, [status, isAccount]);

  if (href === "/cart") {
    count = cartItems.length;
  } else if (href === "/wishlist") {
    count = wishlist.length;
  } else if (isAccount) {
    buttonLabel = status === "authenticated" ? "Profile" : "Account";

    if (status === "authenticated") {
      const displayName = session.user.name || session.user.email.split("@")[0];

      ItemIcon = () => {
        if (userImage && !imageError) {
          return (
            <div className="relative h-6 w-6">
              <Image
                src={userImage}
                alt={displayName}
                fill
                className="rounded-full object-cover"
                sizes="24px"
                onError={() => setImageError(true)}
              />
            </div>
          );
        }
        if (displayName) {
          return <AvatarLetterFallback displayName={displayName} />;
        }
        return <User className="h-6 w-6" />;
      };
    } else if (status === "loading") {
      ItemIcon = () => <Loader2 className="h-6 w-6 animate-spin" />;
    }
  }

  const baseClasses = `p-0 ${MOBILE_ACTION_CLASS}`;
  const colorClasses = isActive
    ? "text-primary bg-primary/5"
    : "text-muted-foreground hover:text-foreground hover:bg-muted/30";

  // ✅ DO NOT use <button> inside <Link> (invalid HTML)
  const buttonContent = (
    <span className={`${baseClasses} ${colorClasses}`}>
      <div className="relative h-6 w-6">
        {isAccount ? <ItemIcon /> : <Icon className="h-6 w-6" />}

        {count > 0 && (href === "/cart" || href === "/wishlist") && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] text-white font-bold flex items-center justify-center border-2 border-card">
            {count}
          </span>
        )}
      </div>

      <span
        className={`text-xs mt-1 ${
          isActive ? "font-semibold text-primary" : "font-normal"
        }`}
      >
        {buttonLabel}
      </span>
    </span>
  );

  // Auth dropdown for account
  if (isAccount && status === "authenticated") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="flex-1">
          {/* Trigger can be a button/span */}
          <button type="button" className="flex-1">
            {buttonContent}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60" align="end">
          <AccountDropdownContent onClose={() => {}} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ✅ Next.js 15 Link usage (no legacyBehavior, no passHref)
  return (
    <Link href={href} className="flex-1" aria-label={buttonLabel}>
      {buttonContent}
    </Link>
  );
};

const MobileBottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-[60] flex justify-between h-14 w-full border-t border-border bg-card md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
    {mobileNavItems.map((item) => (
      <MobileActionItem key={item.label} {...item} />
    ))}
  </nav>
);

export default MobileBottomNav;
