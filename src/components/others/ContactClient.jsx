"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-toastify";

export default function ContactClient() {
  const CONTACT = useMemo(
    () => ({
      brand: "D Chin Mart",
      tagline: "Online Shopping & EMI Marketplace in Bangladesh",
      addressLine1: "Mohonpur, Ramsagar, Dinajpur, Bangladesh",
      addressLine2: "Customer Support: 10:00 AM – 10:00 PM",
      phoneDisplay: "01923363194",
      phoneRaw: "01923363194",
      email: "dchinmart@gmail.com",
      whatsappRaw: "8801923363194", // digits only for wa.me links
      facebookUrl: "https://www.facebook.com/profile.php?id=61561556205308",
      mapLink: "https://maps.google.com/?q=D+Chin+Mart+Dinajpur",
      mapEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d449.9511441598357!2d88.61325374339755!3d25.551392961410816!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fb4f00436dab21%3A0x8406adda3a8d896b!2sD%20Chin%20Mart!5e0!3m2!1sen!2sbd!4v1779440147909!5m2!1sen!2sbd",
    }),
    []
  );

  const [loading, setLoading] = useState(false);
  // Spam trap: hidden from people, filled in by bots.
  const [honeypot, setHoneypot] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return toast.error("Please enter your full name");
    }

    if (!isValidEmail(form.email)) {
      return toast.error("Please enter a valid email address");
    }

    if (!form.subject.trim()) {
      return toast.error("Please enter a subject");
    }

    if (form.message.trim().length < 10) {
      return toast.error("Message should be at least 10 characters");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      toast.success("Thanks! Your message has been sent. We'll reply within 24 hours.");

      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast.error(error.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickSupport = [
    {
      title: "Order Support",
      description: "Need help with an order, delivery or payment?",
      icon: Truck,
    },
    {
      title: "Return Help",
      description: "Questions about return, exchange or refund?",
      icon: RotateCcw,
    },
    {
      title: "EMI Assistance",
      description: "Need help with EMI or installment products?",
      icon: CreditCard,
    },
    {
      title: "Product Query",
      description: "Ask before buying mobiles, laptops or electronics.",
      icon: HelpCircle,
    },
  ];

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-[#07111f] px-6 py-10 text-white shadow-xl sm:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-[#2ea7f2]">
              Contact Support
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Contact {CONTACT.brand}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Have questions about orders, delivery, returns, products or EMI?
              Contact D Chin Mart support and we’ll help you as soon as possible.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${CONTACT.whatsappRaw}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-600"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Support
              </a>

              <a
                href={`tel:${CONTACT.phoneRaw}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-[#2ea7f2] hover:text-[#2ea7f2]"
              >
                <Phone className="h-4 w-4" />
                Call Now
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickSupport.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2ea7f2]/10 text-[#2ea7f2]">
                  <Icon className="h-5 w-5" />
                </div>

                <h2 className="mt-4 text-base font-bold text-slate-900">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardHeader className="bg-white">
                <CardTitle className="text-xl">Contact Information</CardTitle>
                <CardDescription>
                  Quick ways to reach our customer support team.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 bg-white">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#2ea7f2]" />
                  <div>
                    <p className="font-semibold text-slate-900">Address</p>
                    <p className="text-sm text-slate-600">
                      {CONTACT.addressLine1}
                    </p>
                    <p className="text-sm text-slate-600">
                      {CONTACT.addressLine2}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-[#2ea7f2]" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Support Hours
                    </p>
                    <p className="text-sm text-slate-600">
                      10:00 AM – 10:00 PM
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="font-semibold text-slate-900">
                    Quick Actions
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

                  <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#2ea7f2]" />
                      <span>{CONTACT.phoneDisplay}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#2ea7f2]" />
                      <span>{CONTACT.email}</span>
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Social</p>

                  <Button asChild variant="ghost" className="justify-start px-0">
                    <a
                      href={CONTACT.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center"
                    >
                      <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                      Facebook Page
                      <ExternalLink className="ml-2 h-4 w-4 text-slate-400" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card id="find-us" className="scroll-mt-24 overflow-hidden border-0 shadow-sm">
              <CardHeader className="bg-white">
                <CardTitle className="text-xl">Find Us</CardTitle>
                <CardDescription>
                  {CONTACT.addressLine1} ·{" "}
                  <a
                    href={CONTACT.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <iframe
                  title="D Chin Mart Google Map"
                  src={CONTACT.mapEmbedUrl}
                  className="h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2ea7f2]/10 text-[#2ea7f2]">
                    <Send className="h-5 w-5" />
                  </div>

                  <div>
                    <CardTitle className="text-xl">Send a Message</CardTitle>
                    <CardDescription>
                      We usually respond within 24 hours.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={onSubmit} className="space-y-5">
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Website
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={onChange}
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
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

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+8801XXXXXXXXX"
                        value={form.phone}
                        onChange={onChange}
                        autoComplete="tel"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="Order, product, delivery, EMI..."
                        value={form.subject}
                        onChange={onChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={7}
                      placeholder="Write your message in detail..."
                      value={form.message}
                      onChange={onChange}
                    />

                    <p className="text-xs text-slate-500">
                      Tip: Include your order ID or phone number for faster
                      support.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full bg-[#2ea7f2] font-bold hover:bg-[#1b92dc]"
                    disabled={loading}
                  >
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

                  <div className="flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2ea7f2]" />
                    <p>
                      Your information is used only to respond to your message
                      and provide customer support.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Contact D Chin Mart Bangladesh
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                D Chin Mart customer support helps shoppers with product
                questions, order tracking, delivery updates, return requests,
                payment support and EMI-related inquiries. Contact us before
                placing an order if you need product information or installment
                guidance.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/allproducts"
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Browse Products
                </Link>

                <Link
                  href="/faq"
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Read FAQ
                </Link>

                <Link
                  href="/loans/apply"
                  className="rounded-xl bg-[#2ea7f2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b92dc]"
                >
                  Apply for EMI
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}