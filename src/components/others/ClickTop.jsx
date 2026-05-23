"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ClickToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      type="button"
      size="icon"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-12 right-6 z-[9999] h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/90 active:scale-95 ${
        isVisible
          ? "visible translate-y-0 opacity-100"
          : "invisible translate-y-8 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
      <span className="absolute inset-0 -z-10 rounded-full bg-primary/30 animate-ping" />
    </Button>
  );
};

export default ClickToTop;