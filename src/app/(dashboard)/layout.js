import Dashboard from "@/components/Admin/Dashboard/Dashboard";

export const metadata = {
  title: {
    template: "%s | Admin Dashboard",
    default: "Admin Dashboard",
  },
  description:
    "The official admin dashboard for managing all aspects of the e-commerce store.",
};

export default function DashboardLayout({ children }) {
  return (
    <Dashboard>
      <main>{children}</main>
    </Dashboard>
  );
}
