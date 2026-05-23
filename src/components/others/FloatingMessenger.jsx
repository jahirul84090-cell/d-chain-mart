// src/components/FloatingMessenger.jsx

"use client";

import { MessageCircle } from "lucide-react";

export default function FloatingMessenger() {
  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <a
        href="https://m.me/DoctorlistBangladesh"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-full bg-[#0084FF] px-4 py-3 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      >
        {/* Online Indicator */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500"></span>
        </span>

        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
          <MessageCircle className="h-7 w-7 text-[#0084FF]" />
        </div>

        {/* Text */}
        <div className="hidden sm:block text-white">
          <p className="text-sm font-bold leading-none">
            Chat with us
          </p>
          <p className="mt-1 text-xs opacity-90">
            Typically replies instantly
          </p>
        </div>
      </a>
    </div>
  );
}