"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/useDebounce";

export function HeaderSearchComponent({
  className = "",
  placeholder = "Search products...",
  isMobile = false,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  const handleSuggestionClick = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    if (isMobile && onClose) onClose();
  };

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/admin/product?search=${encodeURIComponent(
            debouncedQuery
          )}&limit=10`
        );
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        setSuggestions(data.products || []);
        setIsOpen(data.products?.length > 0 && query.trim().length >= 2);
      } catch (err) {
        console.error(err);
        setError("Error fetching products");
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSuggestion = (product) => {
    router.push(`/${product.slug}`);
    handleSuggestionClick();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        selectSuggestion(suggestions[activeIndex]);
      } else {
        handleFullSearch();
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    if (value.trim().length >= 2) setIsOpen(true);
    else setIsOpen(false);
  };

  const handleFullSearch = () => {
    if (!query.trim()) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
    handleSuggestionClick();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex w-full items-center h-11 md:h-12 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <Input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 border-none bg-transparent px-4 text-sm md:text-base font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus:outline-none h-full"
        />

        {isLoading && (
          <div className="absolute right-14 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}

        <button
          type="button"
          onClick={handleFullSearch}
          className="h-full px-4 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Search className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-[70] w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {error && (
            <div className="p-3 text-sm text-center text-red-500">{error}</div>
          )}

          {!isLoading &&
            suggestions.length === 0 &&
            query.length >= 2 &&
            !error && (
              <div className="p-3 text-sm text-center text-gray-500">
                No products found for “{query}”
              </div>
            )}

          {suggestions.length > 0 && (
            <ul
              className="max-h-72 overflow-y-auto divide-y divide-gray-100"
              role="listbox"
            >
              {suggestions.map((product, index) => (
                <li key={product.id}>
                  <Link
                    href={`/${product.slug}`}
                    onClick={() => selectSuggestion(product)}
                    className={`flex items-center gap-3 p-3 transition-all ${
                      index === activeIndex
                        ? "bg-primary/10"
                        : "hover:bg-gray-50"
                    }`}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden border border-gray-100 bg-gray-50">
                      <Image
                        src={
                          product.mainImage ||
                          "https://placehold.co/60x60?text=IMG"
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {product.category?.name || "Uncategorized"}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                      ৳{product.price?.toLocaleString("en-BD") || "0"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default HeaderSearchComponent;
