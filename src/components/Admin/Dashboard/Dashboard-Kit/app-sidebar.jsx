"use client";

import * as React from "react";
import {
  Check,
  Clipboard,
  CopyMinusIcon,
  DollarSign,
  Image,
  IterationCcw,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  ShoppingBasket,
  Users,
} from "lucide-react";

import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { useSession } from "next-auth/react";

// This is sample data.
export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: Users,
      isActive: true,
    },
    {
      title: "Media",
      url: "/dashboard/media",
      icon: Image,
      isActive: true,
    },

    {
      title: "Product",
      url: "#",
      icon: ShoppingBasket,
      isActive: false,
      items: [
        {
          title: "Manage Category",
          url: "/dashboard/product/category",
        },
        {
          title: "Add Product",
          url: "/dashboard/product/add",
        },
        {
          title: "Manage Product",
          url: "/dashboard/product/manage",
        },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/order/manage",
      icon: Clipboard,
      isActive: true,
    },
    {
      title: "Payment Methods",
      url: "/dashboard/payment-method",
      icon: Landmark,
      isActive: true,
    },
    {
      title: "Product Reviews",
      url: "/dashboard/reviews",
      icon: Check,
      isActive: true,
    },
    {
      title: "Delivery Fees",
      url: "/dashboard/delivery-fees",
      icon: DollarSign,
      isActive: true,
    },
    {
      title: "Invoice",
      url: "/dashboard/invoice",
      icon: CopyMinusIcon,
      isActive: true,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { data: userdata } = useSession();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain user={userdata?.user} items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userdata?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
