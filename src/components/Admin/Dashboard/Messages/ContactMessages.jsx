"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, MailOpen, Phone, Reply, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import AdminPageHeader from "@/components/Admin/Dashboard/AdminPageHeader";

export default function ContactMessages() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ messages: [], total: 0, unread: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?filter=${filter}&page=${page}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setRead = async (id, isRead) => {
    const res = await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isRead }),
    });
    if (res.ok) load();
    else toast.error("Could not update the message.");
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this message permanently?")) return;
    const res = await fetch("/api/admin/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Message deleted.");
      load();
    } else toast.error("Could not delete the message.");
  };

  const toggle = (m) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.isRead) setRead(m.id, true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Messages"
        description={`Messages sent from the Contact page · ${data.unread} unread`}
      />

      <div className="flex gap-2" role="tablist" aria-label="Filter messages">
        {[
          ["all", "All"],
          ["unread", "Unread"],
        ].map(([value, label]) => (
          <Button
            key={value}
            role="tab"
            aria-selected={filter === value}
            variant={filter === value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="flex justify-center py-16" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Loading messages…</span>
          </div>
        ) : data.messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">No messages yet.</p>
        ) : (
          <ul className="divide-y">
            {data.messages.map((m) => (
              <li key={m.id} className={m.isRead ? "" : "bg-primary/5"}>
                <button
                  type="button"
                  onClick={() => toggle(m)}
                  aria-expanded={openId === m.id}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  {m.isRead ? (
                    <MailOpen className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                  ) : (
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className={`truncate ${m.isRead ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                        {m.subject}
                      </p>
                      <time className="text-xs text-gray-500">{formatDate(m.createdAt, { withTime: true })}</time>
                    </div>
                    <p className="truncate text-sm text-gray-500">
                      {m.name} · {m.email}
                    </p>
                  </div>
                </button>
                {openId === m.id && (
                  <div className="space-y-3 px-11 pb-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{m.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`}>
                        <Button size="sm" className="gap-1.5">
                          <Reply className="h-4 w-4" aria-hidden="true" /> Reply by email
                        </Button>
                      </a>
                      {m.phone && (
                        <a href={`tel:${m.phone}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <Phone className="h-4 w-4" aria-hidden="true" /> {m.phone}
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setRead(m.id, false)}>
                        Mark unread
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-600 hover:text-red-700"
                        onClick={() => remove(m.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
