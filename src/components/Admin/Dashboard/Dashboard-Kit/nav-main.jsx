"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

// A link is active on its own page and on pages below it
// (e.g. "Orders" stays highlighted on /dashboard/order/123).
const sectionRoot = (url) => url.split("/").slice(0, 3).join("/");
const matches = (url, pathname) =>
  url !== "#" &&
  (url === pathname ||
    (url !== "/dashboard" && pathname.startsWith(sectionRoot(url) + "/")));

export function NavMain({ items, user }) {
  const pathname = usePathname();
  // Customer management is for super admins only.
  const filteredItems = items.filter(
    (item) => !item.superAdminOnly || user?.role === "SUPER_ADMIN"
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Store management</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => {
          const isActive =
            matches(item.url, pathname) ||
            (item.items && item.items.some((subItem) => matches(subItem.url, pathname)));

          return item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        : "hover:bg-gray-100"
                    }
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          className={
                            matches(subItem.url, pathname)
                              ? "bg-primary/10 font-medium text-primary"
                              : "hover:bg-gray-200"
                          }
                        >
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "hover:bg-gray-100"
                }
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
