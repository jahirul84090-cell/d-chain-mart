"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Section({ title, description, children, action }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PersonalDetails({ profile, onSaved }) {
  const { update } = useSession();
  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phoneNumber || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(profile.image || null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Please choose an image of 2 MB or less.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("phoneNumber", phone);
      if (file) form.append("image", file);
      const res = await fetch("/api/profile", { method: "PATCH", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save your details.");
      toast.success("Your details have been saved.");
      setFile(null);
      onSaved(data.user);
      update?.(); // refresh the name shown in the header
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || profile.email || "?").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <form onSubmit={save} className="grid gap-6 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-primary/10">
          {preview ? (
            <Image src={preview} alt="Your profile photo" fill sizes="96px" className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
              {initials}
            </span>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickFile} />
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInput.current?.click()}>
          <Camera className="h-4 w-4" aria-hidden="true" /> Change photo
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={profile.email} disabled readOnly />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full name</Label>
            <Input id="profile-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Mobile number</Label>
            <Input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              placeholder="01712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

function Addresses() {
  const [addresses, setAddresses] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile/address");
    const data = res.ok ? await res.json() : { addresses: [] };
    setAddresses(data.addresses || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const makeDefault = async (a) => {
    const res = await fetch("/api/profile/address", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, isDefault: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success("Default address updated.");
      load();
    } else toast.error(data.error || "Could not update the address. Edit it to add any missing details.");
  };

  const remove = async (a) => {
    if (!window.confirm("Delete this address?")) return;
    const res = await fetch("/api/profile/address", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success("Address deleted.");
      load();
    } else toast.error(data.error === "Cannot delete address linked to orders" ? "This address is used by past orders and can't be deleted." : data.error || "Could not delete the address.");
  };

  return (
    <Section
      title="Saved addresses"
      description="Used for delivery at checkout."
      action={
        <Link href="/profile/address/add">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add address
          </Button>
        </Link>
      }
    >
      {addresses === null ? (
        <div className="flex justify-center py-8" role="status">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading addresses…</span>
        </div>
      ) : addresses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
          You haven&apos;t saved an address yet.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className={`rounded-xl border p-4 ${a.isDefault ? "border-primary/40 bg-primary/5" : "border-gray-200"}`}>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-gray-900">{a.street}</p>
                  <p className="text-gray-600">{[a.state, a.city, a.zipCode].filter(Boolean).join(", ")}</p>
                  <p className={a.phoneNumber ? "text-gray-600" : "text-amber-700"}>
                    {a.phoneNumber || "No phone number — edit to add one"}
                  </p>
                  {a.isDefault && (
                    <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/profile/address/add?id=${a.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                  </Button>
                </Link>
                {!a.isDefault && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => makeDefault(a)}>
                    <Star className="h-3.5 w-3.5" aria-hidden="true" /> Make default
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 hover:text-red-700"
                  onClick={() => remove(a)}
                  aria-label={`Delete address ${a.street}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ChangePassword({ hasPassword }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  if (!hasPassword) {
    return (
      <Section title="Password" description="You sign in with Google, so there's no password to manage here." />
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      toast.error("The new passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not change your password.");
      toast.success("Your password has been changed.");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (id, label, key, autoComplete) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required
      />
    </div>
  );

  return (
    <Section title="Change password" description="Use at least 8 characters.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        {field("pw-current", "Current password", "currentPassword", "current-password")}
        {field("pw-new", "New password", "newPassword", "new-password")}
        {field("pw-confirm", "Confirm new password", "confirm", "new-password")}
        <div className="sm:col-span-3">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Update password
          </Button>
        </div>
      </form>
    </Section>
  );
}

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setProfile(d.user))
      .catch(() => setError("We couldn't load your profile. Please refresh the page."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Profile &amp; addresses</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your personal details, delivery addresses and password.</p>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : !profile ? (
        <div className="flex justify-center py-16" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading your profile…</span>
        </div>
      ) : (
        <>
          <Section title="Personal details">
            <PersonalDetails profile={profile} onSaved={setProfile} />
          </Section>
          <Addresses />
          <ChangePassword hasPassword={profile.hasPassword} />
        </>
      )}
    </div>
  );
}
