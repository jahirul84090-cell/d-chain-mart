"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Facebook,
  MessageCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";

export default function ContactClient() {
  // ✅ Replace with your real info
  const CONTACT = useMemo(
    () => ({
      brand: "DoctorList",
      addressLine1: "Dinajpur, Bangladesh",
      addressLine2: "Support: 10:00 AM – 10:00 PM",
      phoneDisplay: "+880 1XXXXXXXXX",
      phoneRaw: "+8801XXXXXXXXX",
      email: "support@doctorlist.info.bd",
      whatsappRaw: "8801XXXXXXXXX",
      facebookUrl: "https://facebook.com/yourpage",
      mapEmbedUrl:
        "https://www.google.com/maps?q=Dinajpur,Bangladesh&output=embed",
    }),
    []
  );

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error("Please enter your name");
    if (!isValidEmail(form.email)) return toast.error("Enter a valid email");
    if (form.message.trim().length < 10)
      return toast.error("Message should be at least 10 characters");

    try {
      setLoading(true);

      // 🔁 Replace with your API route (example below)
      // await fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })
      await new Promise((r) => setTimeout(r, 1200));

      toast.success("Thanks! Your message has been sent.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Contact {CONTACT.brand}
        </h1>
        <p className="text-muted-foreground mt-2">
          Have a question, feedback, or partnership idea? Send a message — we’ll
          reply as soon as possible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Info + Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Quick ways to reach our support team
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">
                    {CONTACT.addressLine1}
                  </p>
                  <p className="text-muted-foreground">
                    {CONTACT.addressLine2}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="font-medium">Quick Actions</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button asChild variant="outline" className="justify-start">
                    <a href={`tel:${CONTACT.phoneRaw}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </a>
                  </Button>

                  <Button asChild variant="outline" className="justify-start">
                    <a href={`mailto:${CONTACT.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </a>
                  </Button>

                  <Button asChild variant="outline" className="justify-start">
                    <a
                      href={`https://wa.me/${CONTACT.whatsappRaw}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{CONTACT.phoneDisplay}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{CONTACT.email}</span>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="font-medium">Social</p>
                <Button asChild variant="ghost" className="justify-start px-0">
                  <a
                    href={CONTACT.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center"
                  >
                    <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                    Facebook Page
                    <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map Card */}
          <Card className="overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle>Find Us on Google Maps</CardTitle>
              <CardDescription>Location preview</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                title="Google Map"
                src={CONTACT.mapEmbedUrl}
                className="w-full h-72 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Form */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
              <CardDescription>
                We usually respond within 24 hours
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={onChange}
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={onChange}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    placeholder="Write your message in detail..."
                    value={form.message}
                    onChange={onChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Include your phone number if you want a call-back.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By sending this message, you agree to our communication
                  policy.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
