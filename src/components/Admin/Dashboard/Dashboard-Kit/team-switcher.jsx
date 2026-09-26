"use client";

import Link from "next/link";
import Image from "next/image";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Store brand at the top of the admin sidebar.
export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/dashboard">
            <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary p-1">
              <Image src="/logo.png" alt="" width={28} height={16} className="h-auto w-full" />
            </span>
            <span className="grid flex-1 text-left text-sm leading-tight">
              <span className="font-semibold">D Chin Mart</span>
              <span className="text-xs text-muted-foreground">Store admin</span>
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
