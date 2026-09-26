"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Ban, ExternalLink, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "@/lib/useDebounce";
import { formatDate } from "@/lib/format";
import AdminPageHeader from "@/components/Admin/Dashboard/AdminPageHeader";

const ROLE_LABEL = { USER: "Customer", ADMIN: "Admin", SUPER_ADMIN: "Super admin" };
const FILTERS = [
  ["ALL", "Everyone"],
  ["USER", "Customers"],
  ["ADMIN", "Admins"],
  ["SUPER_ADMIN", "Super admins"],
  ["BLOCKED", "Blocked"],
];

const initials = (name, email) =>
  (name || email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function StatusBadge({ user }) {
  if (user.isBlocked) {
    return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Blocked</span>;
  }
  if (!user.emailVerified) {
    return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Unverified</span>;
  }
  return <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>;
}

export default function UserManager() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, user, role? }

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, role: filter, search: debouncedSearch });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      toast.error("Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const send = async (method, body, success) => {
    setBusyId(body.userId);
    try {
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      toast.success(success);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const runConfirmed = () => {
    const { type, user, role } = confirm;
    setConfirm(null);
    if (type === "role") send("PATCH", { userId: user.id, role }, `Role changed to ${ROLE_LABEL[role]}.`);
    if (type === "block") send("PATCH", { userId: user.id, isBlocked: !user.isBlocked }, user.isBlocked ? "Account unblocked." : "Account blocked.");
    if (type === "delete") send("DELETE", { userId: user.id }, "Account deleted.");
  };

  const isSelf = (u) => u.id === session?.user?.id;

  const Actions = ({ user }) => (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href={`/dashboard/users/${user.id}`}>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> View
        </Button>
      </Link>
      {isSuperAdmin && !isSelf(user) && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busyId === user.id}
            onClick={() => setConfirm({ type: "block", user })}
          >
            {user.isBlocked ? (
              <><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Unblock</>
            ) : (
              <><Ban className="h-3.5 w-3.5" aria-hidden="true" /> Block</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 hover:text-red-700"
            disabled={busyId === user.id}
            onClick={() => setConfirm({ type: "delete", user })}
            aria-label={`Delete ${user.name || user.email}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </>
      )}
    </div>
  );

  const RoleControl = ({ user }) =>
    isSuperAdmin && !isSelf(user) ? (
      <Select
        value={user.role}
        onValueChange={(role) => role !== user.role && setConfirm({ type: "role", user, role })}
        disabled={busyId === user.id}
      >
        <SelectTrigger className="h-8 w-36" aria-label={`Role for ${user.name || user.email}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <span className="text-sm text-gray-700">{ROLE_LABEL[user.role]}{isSelf(user) && " (you)"}</span>
    );

  const confirmText = confirm && {
    role: {
      title: `Change role to ${ROLE_LABEL[confirm.role]}?`,
      body: confirm.role === "USER"
        ? "They will lose access to the admin dashboard."
        : confirm.role === "ADMIN"
        ? "Admins can manage orders, products, reviews, loans and settings, but not customers or roles."
        : "Super admins have full access, including managing customers and roles.",
      action: "Change role",
    },
    block: confirm.user.isBlocked
      ? { title: "Unblock this account?", body: "They will be able to sign in and order again.", action: "Unblock" }
      : { title: "Block this account?", body: "They will be signed out and won't be able to sign in or place orders. Their orders are kept.", action: "Block account" },
    delete: {
      title: "Delete this account permanently?",
      body: "This removes the account, addresses, cart, wishlist and reviews. Customers with orders or EMI records can't be deleted — block them instead.",
      action: "Delete",
    },
  }[confirm.type];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customers"
        description={`${total} account${total === 1 ? "" : "s"}. ${isSuperAdmin ? "Change roles, block or remove accounts." : ""}`}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          placeholder="Search by name or email"
          aria-label="Search customers"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="sm:w-44" aria-label="Filter accounts"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTERS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="flex justify-center py-16" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Loading customers…</span>
          </div>
        ) : users.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">No accounts match your search.</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(u.name, u.email)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{u.name || "—"}</p>
                          <p className="truncate text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleControl user={u} /></td>
                    <td className="px-4 py-3"><StatusBadge user={u} /></td>
                    <td className="px-4 py-3 tabular-nums">{u._count?.orders ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3"><Actions user={u} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="divide-y md:hidden">
              {users.map((u) => (
                <li key={u.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{u.name || "—"}</p>
                      <p className="truncate text-sm text-gray-500">{u.email}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {u._count?.orders ?? 0} orders · joined {formatDate(u.createdAt)}
                      </p>
                    </div>
                    <StatusBadge user={u} />
                  </div>
                  <RoleControl user={u} />
                  <Actions user={u} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmText?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-gray-900">{confirm?.user?.name || confirm?.user?.email}</span>
              {" — "}
              {confirmText?.body}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirmed}
              className={confirm?.type === "delete" || (confirm?.type === "block" && !confirm.user.isBlocked) ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmText?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
