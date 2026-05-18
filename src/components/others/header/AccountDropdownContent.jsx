// components/header/AccountDropdownContent.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // NOTE: Assumed these UI components are here
import {
  User,
  Loader2,
  LogOut,
  UserCircle,
  Package,
  ListOrdered,
} from "lucide-react";

// --- Utility Components ---

export const AvatarLetterFallback = ({
  displayName,
  sizeClass = "h-6 w-6",
  textClass = "text-sm",
}) => {
  const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary-foreground text-primary font-bold flex items-center justify-center ${textClass}`}
      aria-label={`Avatar for ${displayName}`}
    >
      {firstLetter}
    </div>
  );
};

// --- Main Dropdown Content Component ---

const AccountDropdownContent = ({ onClose }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-sm ml-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "authenticated") {
    const displayName = session.user.name || session.user.email.split("@")[0];

    const DropdownHeaderAvatar = () => {
      const [imageError, setImageError] = useState(false);
      const userImage = useMemo(
        () =>
          session?.user?.image && session.user.image.trim() !== ""
            ? session.user.image
            : null,
        [session]
      );

      useEffect(() => {
        if (session && userImage) {
          setImageError(false);
        }
      }, [userImage, session]);

      // If image is available and no error
      if (userImage && !imageError) {
        return (
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src={userImage}
              alt={displayName}
              fill
              className="rounded-full object-cover"
              sizes="40px"
              onError={() => setImageError(true)}
            />
          </div>
        );
      }
      // Fallback: Letter or default
      return (
        <AvatarLetterFallback
          displayName={displayName}
          sizeClass="h-10 w-10"
          textClass="text-lg"
        />
      );
    };

    return (
      <>
        <div className="flex items-center gap-3 p-3">
          <DropdownHeaderAvatar />
          <div className="flex flex-col space-y-0.5 min-w-0">
            <p
              className="text-base font-medium leading-tight truncate"
              title={displayName}
            >
              {displayName}
            </p>
            <p className="text-sm leading-none text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            router.push("/details");
            onClose && onClose();
          }}
          className="cursor-pointer"
        >
          <Package className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            router.push("/profile");
            onClose && onClose();
          }}
          className="cursor-pointer"
        >
          <UserCircle className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            router.push("/orders");
            onClose && onClose();
          }}
          className="cursor-pointer"
        >
          <ListOrdered className="mr-2 h-4 w-4" />
          <span>My Orders</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive font-medium cursor-pointer focus:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </>
    );
  }

  // Unauthenticated State
  return (
    <DropdownMenuItem
      className="cursor-pointer font-semibold justify-center text-primary"
      onClick={() => signIn(null, { callbackUrl: "/account" })}
    >
      <User className="mr-2 h-4 w-4" />
      <span>Sign In / Register</span>
    </DropdownMenuItem>
  );
};

export default AccountDropdownContent;
