/**
 * File: app/admin/accounting/expenses/page.jsx
 */

"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;

const todayDate = new Date().toISOString().slice(0, 10);

const firstDayOfMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
)
  .toISOString()
  .slice(0, 10);

function dateFmt(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const emptyForm = {
  title: "",
  amount: "",
  category: "",
  note: "",
  expenseAt: todayDate,
};

export default function AccountingExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalExpense: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(todayDate);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  const [openForm, setOpenForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function loadExpenses(page = 1) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");

      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q.trim()) params.set("q", q.trim());
      if (category.trim()) params.set("category", category.trim());

      const res = await fetch(`/api/admin/accounting/expenses?${params}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load expenses.");
        return;
      }

      setExpenses(data.expenses || []);
      setSummary(data.summary || { totalExpense: 0 });
      setPagination(
        data.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 1,
        }
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses(1);
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
  }

  function openCreateModal() {
    resetForm();
    setOpenForm(true);
  }

  function openEditModal(expense) {
    setEditing(expense);
    setForm({
      title: expense.title || "",
      amount: String(expense.amount || ""),
      category: expense.category || "",
      note: expense.note || "",
      expenseAt: expense.expenseAt
        ? new Date(expense.expenseAt).toISOString().slice(0, 10)
        : todayDate,
    });
    setOpenForm(true);
  }

  async function submitExpense() {
    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title,
        amount: Number(form.amount),
        category: form.category || null,
        note: form.note || null,
        expenseAt: form.expenseAt,
      };

      const url = editing
        ? `/api/admin/accounting/expenses/${editing.id}`
        : "/api/admin/accounting/expenses";

      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to save expense.");
        return;
      }

      setOpenForm(false);
      resetForm();
      await loadExpenses(pagination.page || 1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(
        `/api/admin/accounting/expenses/${deleteTarget.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to delete expense.");
        return;
      }

      setDeleteTarget(null);
      await loadExpenses(pagination.page || 1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
            <p className="text-sm text-muted-foreground">
              Manage daily, monthly and business expenses.
            </p>
          </div>

          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Expense
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">
                    {money(summary.totalExpense)}
                  </h2>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="grid gap-3 p-4 md:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  From
                </label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  To
                </label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Rent, Salary..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => loadExpenses(1)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Expense List
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading expenses...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : expenses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No expenses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{dateFmt(expense.expenseAt)}</TableCell>
                        <TableCell className="font-medium">
                          {expense.title}
                        </TableCell>
                        <TableCell>
                          {expense.category ? (
                            <Badge variant="outline">
                              {expense.category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                          {expense.note || "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {money(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => openEditModal(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => setDeleteTarget(expense)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} — Total{" "}
                {pagination.total} entries
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => loadExpenses(pagination.page - 1)}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  disabled={
                    pagination.page >= pagination.totalPages || loading
                  }
                  onClick={() => loadExpenses(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Shop rent, salary, transport..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Category
              </label>
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="Rent, Salary, Marketing..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Expense Date
              </label>
              <Input
                type="date"
                value={form.expenseAt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, expenseAt: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Note</label>
              <Textarea
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Optional note"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button onClick={submitExpense} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update Expense" : "Create Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Expense?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={deleteExpense}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}