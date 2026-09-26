"use client";

import * as React from "react";
import {
  Boxes,
  ClipboardList,
  FilePlus2,
  Image,
  Landmark,
  LayoutDashboard,
  Mail,
  ShoppingBasket,
  Star,
  Truck,
  Users,
  Wallet,
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

// Admin navigation. `title` is also used for page breadcrumbs.
export const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Orders", url: "/dashboard/order/manage", icon: ClipboardList },
    { title: "Manual Order", url: "/dashboard/invoice", icon: FilePlus2 },
    {
      title: "Products",
      url: "#",
      icon: ShoppingBasket,
      items: [
        { title: "All Products", url: "/dashboard/product/manage" },
        { title: "Add Product", url: "/dashboard/product/add" },
        { title: "Categories", url: "/dashboard/product/category" },
      ],
    },
    { title: "Reviews", url: "/dashboard/reviews", icon: Star },
    { title: "Customers", url: "/dashboard/users", icon: Users, superAdminOnly: true },
    { title: "Messages", url: "/dashboard/messages", icon: Mail },
    { title: "EMI & Loans", url: "/dashboard/loans", icon: Wallet },
    { title: "Inventory", url: "/dashboard/inventory", icon: Boxes },
    { title: "Payment Methods", url: "/dashboard/payment-method", icon: Landmark },
    { title: "Delivery Fees", url: "/dashboard/delivery-fees", icon: Truck },
    { title: "Media Library", url: "/dashboard/media", icon: Image },
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
