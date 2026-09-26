import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./Dashboard-Kit/app-sidebar";
import AdminBreadcrumb from "./AdminBreadcrumb";

export default function Dashboard({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* min-w-0 lets wide tables scroll inside their card instead of the page */}
      <SidebarInset className="min-w-0 bg-gray-50/60">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <AdminBreadcrumb />
          <Link
            href="/"
            target="_blank"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            View store <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
