"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CheckCircle2, CreditCard, Heart, Loader2, Package, Truck } from "lucide-react";
import PendingReviewsList from "./PendingReviewList";
import { OrderCard } from "./Allorders";

function Stat({ icon: Icon, label, value, href, tone }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-2xl font-bold leading-none text-gray-900">{value}</span>
        <span className="mt-1 block text-sm text-gray-500">{label}</span>
      </span>
    </Link>
  );
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/dashboard").then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch("/api/orders?page=1&pageSize=3").then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([s, o]) => {
        setStats(s);
        setRecentOrders(o.data);
      })
      .catch(() => setError("We couldn't load your account overview. Please refresh the page."));
  }, []);

  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {firstName ? `Hi, ${firstName}` : "My account"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">Track orders, manage your wishlist, EMI and addresses.</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : !stats ? (
        <div className="flex justify-center py-16" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={Package} label="Total orders" value={stats.totalOrders} href="/orders" tone="bg-sky-50 text-sky-600" />
            <Stat icon={Truck} label="On the way" value={stats.pendingOrders} href="/orders" tone="bg-amber-50 text-amber-600" />
            <Stat icon={CheckCircle2} label="Delivered" value={stats.completedOrders} href="/orders" tone="bg-green-50 text-green-600" />
            <Stat icon={Heart} label="Wishlist" value={stats.wishlistItems} href="/wishlist" tone="bg-rose-50 text-rose-600" />
          </div>

          {stats.activeLoans > 0 && (
            <Link
              href="/loans/details"
              className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm"
            >
              <span className="flex items-center gap-2 font-medium text-gray-900">
                <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
                You have {stats.activeLoans} active EMI plan{stats.activeLoans === 1 ? "" : "s"}
              </span>
              <span className="font-semibold text-primary">View</span>
            </Link>
          )}

          <PendingReviewsList />

          <section aria-labelledby="recent-orders">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="recent-orders" className="text-lg font-semibold text-gray-900">Recent orders</h2>
              {recentOrders.length > 0 && (
                <Link href="/orders" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              )}
            </div>
            {recentOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
                No orders yet.{" "}
                <Link href="/allproducts" className="font-medium text-primary hover:underline">
                  Start shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
