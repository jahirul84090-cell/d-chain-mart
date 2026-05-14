// components/header/DesktopActions.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "react-toastify";
import { User, Heart, ShoppingCart, Loader2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { useCartWithSession } from "@/lib/cartStore";

import { useWishlistWithSession } from "../Header";
import AccountDropdownContent, {
  AvatarLetterFallback,
} from "./AccountDropdownContent";

const BADGE_CLASS =
  "absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white text-[10px] font-bold text-primary flex items-center justify-center border-2 border-primary";

const ACTION_BUTTON_CLASS =
  "relative h-11 w-11 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-all duration-200";

const AccountDropdown = () => {
  const { data: session, status } = useSession();
  const [imageError, setImageError] = useState(false);

  const userImage = useMemo(
    () =>
      session?.user?.image && session.user.image.trim() !== ""
        ? session.user.image
        : null,
    [session]
  );

  useEffect(() => {
    if (status === "authenticated") {
      setImageError(false);
    }
  }, [userImage, status]);

  const DesktopAvatarContent = () => {
    if (status !== "authenticated")
      return <User className="h-6 w-6 text-primary-foreground" />;

    const displayName = session.user.name || session.user.email.split("@")[0];

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

    return <User className="h-6 w-6 text-primary-foreground" />;
  };

  if (status === "loading") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={ACTION_BUTTON_CLASS}
        aria-label="Loading account status"
      >
        <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
      </Button>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={ACTION_BUTTON_CLASS}
        onClick={() => signIn(null, { callbackUrl: "/" })}
        aria-label="Sign in"
      >
        <User className="h-6 w-6 text-primary-foreground" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={ACTION_BUTTON_CLASS}
          aria-label="Account menu"
        >
          <DesktopAvatarContent />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="end">
        {/* Note: onClose is not strictly necessary here, but kept for consistency */}
        <AccountDropdownContent onClose={() => {}} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Wishlist Dropdown (uses useWishlistWithSession) ---

const WishlistDropdown = () => {
  const { wishlist, toggleWishlist, isToggling } = useWishlistWithSession();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const handleRemove = (product) => {
    toggleWishlist(product, true).catch(() => {
      toast.error("Failed to remove item.");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={ACTION_BUTTON_CLASS}
          aria-label="Wishlist"
        >
          <Heart className="h-6 w-6 text-primary-foreground" />
          {wishlist.length > 0 && (
            <span className={BADGE_CLASS}>{wishlist.length}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0 shadow-lg" align="end">
        <div className="p-4 border-b">
          <p className="text-lg font-bold">Wishlist ({wishlist.length})</p>
        </div>

        <div className="max-h-80 overflow-y-auto p-4 space-y-4">
          {!isLoggedIn && (
            <p className="text-xs text-yellow-600 font-medium p-1 bg-yellow-50 dark:bg-yellow-950/30 rounded-md">
              ⚠️ Log in to save permanently.
            </p>
          )}
          {wishlist.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Heart className="w-9 h-9 mx-auto mb-2" />
              <p>Your wishlist is empty.</p>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3 pb-3 border-b last:border-b-0"
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={
                      item.mainImage ||
                      "https://placehold.co/600x600/E5E7EB/A2A9B0?text=No+Image"
                    }
                    alt={item.name}
                    fill
                    className="object-cover rounded-md border border-input"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium text-sm hover:text-primary transition-colors block leading-tight truncate"
                  >
                    {item.name}
                  </Link>
                  <p className="font-semibold text-sm text-primary mt-1">
                    ৳ {item.price ? item.price.toLocaleString("en-BD") : "N/A"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(item)}
                  disabled={isToggling}
                  className="text-destructive hover:bg-destructive/10 flex-shrink-0 w-8 h-8 mt-1"
                  aria-label={`Remove ${item.name}`}
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="p-4 pt-0">
          <Link href="/wishlist" passHref legacyBehavior>
            <Button variant="outline" className="w-full py-3 font-bold text-sm">
              Go to Wishlist Page
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Cart Dropdown (uses useCartWithSession) ---

const CartDropdown = () => {
  const { cartItems, removeFromCart } = useCartWithSession();
  const { status } = useSession();
  const [isRemoving, setIsRemoving] = useState(null);

  const handleRemove = async (dbItemId, identifier, productName) => {
    setIsRemoving(identifier);
    try {
      await removeFromCart(dbItemId, identifier);
      toast.success(`${productName} removed from cart.`);
    } catch (error) {
      console.error("Cart removal failed:", error);
      toast.error(error.message || "Failed to remove item from cart.");
    } finally {
      setIsRemoving(null);
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={ACTION_BUTTON_CLASS}
          aria-label="Shopping Cart"
        >
          <ShoppingCart className="h-6 w-6 text-primary-foreground" />
          {cartItems.length > 0 && (
            <span className={BADGE_CLASS}>{cartItems.length}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0 shadow-lg" align="end">
        <div className="p-4 border-b">
          <p className="text-lg font-bold">Cart ({cartItems.length} items)</p>
        </div>

        <div className="max-h-80 overflow-y-auto p-4 space-y-4">
          {status !== "authenticated" && (
            <p className="text-xs text-yellow-600 font-medium p-1 bg-yellow-50 dark:bg-yellow-950/30 rounded-md">
              ⚠️ Log in to save permanently.
            </p>
          )}
          {cartItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3 pb-3 border-b last:border-b-0"
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={
                      item.image ||
                      "https://placehold.co/600x600/E5E7EB/A2A9B0?text=No+Image"
                    }
                    alt={item.name}
                    fill
                    className="object-cover rounded-md border border-input"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium text-sm hover:text-primary transition-colors block leading-tight truncate"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    Qty: **{item.quantity}**
                  </p>
                  <p className="font-semibold text-sm text-primary mt-1">
                    ৳ {(item.price * item.quantity).toLocaleString("en-BD")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleRemove(item.dbItemId, item.id, item.name)
                  }
                  disabled={isRemoving === item.id}
                  className="text-destructive hover:bg-destructive/10 flex-shrink-0 w-8 h-8 mt-1"
                  aria-label={`Remove ${item.name}`}
                >
                  {isRemoving === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex justify-between items-center mb-3 font-bold text-base">
            <span>Subtotal:</span>
            <span className="text-primary">
              ৳ {totalPrice.toLocaleString("en-BD")}
            </span>
          </div>
          <div className="flex gap-2 flex-col">
            <Link href="/cart" passHref legacyBehavior>
              <Button
                variant="outline"
                className="w-full cursor-pointer py-3 font-bold text-sm"
                disabled={cartItems.length === 0}
              >
                Go to Cart
              </Button>
            </Link>
            <Link href="/checkout" passHref legacyBehavior>
              <Button
                className="w-full rounded-sm cursor-pointer font-semibold bg-primary hover:bg-primary/90 py-3 text-sm"
                disabled={cartItems.length === 0}
              >
                Checkout
              </Button>
            </Link>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DesktopActions = () => (
  <>
    <div className="hidden md:block">
      <AccountDropdown />
    </div>
    <WishlistDropdown />
    <CartDropdown />
  </>
);

export default DesktopActions;
