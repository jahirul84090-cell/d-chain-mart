"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Loader2,
  ArrowRight,
  PackageSearch,
  TrendingUp,
} from "lucide-react";
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
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  const handleSuggestionClick = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setIsFocused(false);
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
          `/api/admin/product?search=${encodeURIComponent(debouncedQuery)}&limit=10`,
        );
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setSuggestions(data.products || []);
        setIsOpen(data.products?.length > 0 && query.trim().length >= 2);
      } catch (err) {
        setError("Something went wrong. Please try again.");
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
        setIsFocused(false);
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
      if (activeIndex >= 0) selectSuggestion(suggestions[activeIndex]);
      else handleFullSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setIsFocused(false);
      inputRef.current?.blur();
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

  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.trim()})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-primary font-bold">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* ── Search Input ── */}
      <div
        className={[
          "flex w-full items-center h-11 rounded-xl border bg-white transition-all duration-200 overflow-hidden",
          isFocused
            ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
            : "border-gray-200 shadow-sm hover:border-primary/40 hover:shadow-md",
        ].join(" ")}
      >
        {/* Left search icon */}
        <div className="pl-3.5 pr-2 flex items-center flex-shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          className="flex-1 border-none bg-transparent px-1 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus:outline-none h-full shadow-none"
        />

        {/* Clear button */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="px-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 text-lg leading-none"
            aria-label="Clear search"
          >
            ×
          </button>
        )}

        <Separator
          orientation="vertical"
          className="h-5 bg-gray-200 mx-1 flex-shrink-0"
        />

        {/* Search button */}
        <button
          type="button"
          onClick={handleFullSearch}
          aria-label="Search"
          className="h-full px-4 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute z-[70] w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Error state */}
          {error && (
            <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-red-500">
              <PackageSearch className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Empty state */}
          {!isLoading &&
            suggestions.length === 0 &&
            query.length >= 2 &&
            !error && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
                <PackageSearch className="w-8 h-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  No results for{" "}
                  <span className="font-bold text-gray-900">"{query}"</span>
                </p>
                <p className="text-xs text-gray-400">Try a different keyword</p>
              </div>
            )}

          {/* Results */}
          {suggestions.length > 0 && (
            <>
              {/* Results header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Results
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-gray-200 text-gray-600 h-4 px-1.5"
                >
                  {suggestions.length}
                </Badge>
              </div>

              <ul
                className="max-h-[320px] overflow-y-auto divide-y divide-gray-50 py-1"
                role="listbox"
              >
                {suggestions.map((product, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li key={product.id}>
                      <Link
                        href={`/${product.slug}`}
                        onClick={() => selectSuggestion(product)}
                        className={[
                          "flex items-center gap-3 px-4 py-2.5 transition-all duration-150 group",
                          isActive ? "bg-primary/5" : "hover:bg-primary/5",
                        ].join(" ")}
                        role="option"
                        aria-selected={isActive}
                      >
                        {/* Product image */}
                        <div className="relative w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
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

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate leading-snug">
                            {highlightMatch(product.name, query)}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5 font-medium">
                            {product.category?.name || "Uncategorized"}
                          </p>
                        </div>

                        {/* Price + arrow */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-bold text-gray-900">
                            ৳{product.price?.toLocaleString("en-BD") || "0"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Footer — view all */}
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
                <button
                  type="button"
                  onClick={handleFullSearch}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary transition-colors duration-150 py-0.5 group"
                >
                  <Search className="w-3.5 h-3.5" />
                  See all results for{" "}
                  <span className="text-primary font-bold">"{query}"</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default HeaderSearchComponent;
