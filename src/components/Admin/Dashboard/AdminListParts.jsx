"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/**
 * List filters kept in the URL, so refresh, back/forward and shared links
 * keep the admin's place. Returns [values, update]; update() merges changes,
 * drops defaults from the URL and resets to page 1 unless a page is given.
 */
export function useListParams(defaults) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const values = Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const raw = searchParams.get(key);
      if (raw === null) return [key, fallback];
      return [key, typeof fallback === "number" ? Number(raw) || fallback : raw];
    })
  );

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams.toString());
      const merged = { ...changes };
      if (!("page" in merged) && "page" in defaults) merged.page = defaults.page;
      for (const [key, value] of Object.entries(merged)) {
        if (value === undefined || value === null || value === "" || value === defaults[key]) next.delete(key);
        else next.set(key, String(value));
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, pathname, router]
  );

  return [values, update];
}

/** Tabs with counts, e.g. All 12 · Live 11 · Hidden 1. Scrolls sideways on phones. */
export function StatusTabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  active ? "bg-white/20 text-white" : tab.alert && tab.count > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ListPagination({ page, totalPages, total, pageSize, onPage, noun = "items" }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
      <p>
        Showing <span className="font-medium text-gray-900">{from}–{to}</span> of{" "}
        <span className="font-medium text-gray-900">{total}</span> {noun}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ListState({ loading, error, empty, emptyTitle, emptyHint, action, onRetry }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" /> Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-14 text-center" role="alert">
        <p className="text-sm text-red-700">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="py-14 text-center">
        <p className="font-medium text-gray-900">{emptyTitle}</p>
        {emptyHint && <p className="mt-1 text-sm text-gray-500">{emptyHint}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
  return null;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Delete", busy, onConfirm, onCancel }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
