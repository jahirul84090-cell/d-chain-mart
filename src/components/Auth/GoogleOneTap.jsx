"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";

export default function GoogleOneTap() {
  useEffect(() => {
    // Check if the script is already loaded to avoid duplication
    if (
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      )
    ) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        toast.error("Google One Tap could not initialize.");
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (!response.credential) {
              toast.error("No Google credential received.");
              return;
            }

            try {
              const result = await signIn("google", {
                idToken: response.credential, // The critical fix
                callbackUrl: "/dashboard",
                redirect: true,
              });
            } catch (err) {
              console.error("[GoogleOneTap] signIn error:", err);
              toast.error("Google One Tap sign-in failed.");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true, // Recommended for better cross-browser compatibility
        });

        window.google.accounts.id.prompt((notification) => {});
      } catch (err) {
        console.error("[GoogleOneTap] Initialization error:", err);
        toast.error("Error initializing Google One Tap.");
      }
    };

    script.onerror = (err) => {
      console.error("[GoogleOneTap] Script load error:", err);
      toast.error("Failed to load Google client.");
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  return null;
}
