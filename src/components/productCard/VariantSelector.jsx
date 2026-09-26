"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { colorToCss, isLightColor } from "@/lib/product-options";

/**
 * Accessible colour and size pickers shared by the product page, quick view
 * and deals. Options render as a radio group: arrow keys move between them,
 * and every colour always shows its name so no option is ever invisible.
 */

function OptionGroup({ label, value, options, onChange, renderOption, size = "md" }) {
  const handleKeyDown = (event, index) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (index + keys[event.key] + options.length) % options.length;
    onChange(options[next]);
    event.currentTarget.parentElement?.children[next]?.focus();
  };

  return (
    <fieldset className={size === "sm" ? "mb-3" : "mb-5"}>
      <legend className="mb-2 flex w-full items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {label}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {value || `Select ${label.toLowerCase()}`}
        </span>
      </legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (!value && index === 0) ? 0 : -1}
              onClick={() => onChange(option)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {renderOption(option, selected)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ColorChip({ color, selected, size }) {
  // Resolve CSS colours after mount: CSS.supports only exists in the browser,
  // and resolving on the server too would cause a hydration mismatch.
  const [css, setCss] = useState(null);
  useEffect(() => setCss(colorToCss(color)), [color]);
  const light = isLightColor(css);
  const small = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-xl border transition-all ${
        small ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm"
      } font-medium ${
        selected
          ? "border-primary bg-primary/5 text-gray-900 ring-1 ring-primary dark:text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      {css && (
        <span
          aria-hidden="true"
          className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${
            small ? "h-4 w-4" : "h-5 w-5"
          } ${light ? "border border-gray-300" : "border border-black/10"}`}
          style={{ background: css }}
        >
          {selected && (
            <Check
              className={`${small ? "h-2.5 w-2.5" : "h-3 w-3"} ${
                light ? "text-gray-800" : "text-white"
              }`}
              strokeWidth={3}
            />
          )}
        </span>
      )}
      {color}
    </span>
  );
}

export function ColorOptions({ colors, value, onChange, size }) {
  if (!colors?.length) return null;
  return (
    <OptionGroup
      label="Color"
      value={value}
      options={colors}
      onChange={onChange}
      size={size}
      renderOption={(color, selected) => (
        <ColorChip color={color} selected={selected} size={size} />
      )}
    />
  );
}

export function SizeOptions({ sizes, value, onChange, size }) {
  if (!sizes?.length) return null;
  const small = size === "sm";
  return (
    <OptionGroup
      label="Size"
      value={value}
      options={sizes}
      onChange={onChange}
      size={size}
      renderOption={(option, selected) => (
        <span
          className={`inline-flex items-center justify-center rounded-xl border font-semibold transition-all ${
            small ? "h-8 min-w-[36px] px-2 text-xs" : "h-10 min-w-[44px] px-3 text-sm"
          } ${
            selected
              ? "border-primary bg-primary text-white shadow-sm"
              : "border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          }`}
        >
          {option}
        </span>
      )}
    />
  );
}

/**
 * Quantity stepper. `max` is the available stock.
 */
export function QuantityStepper({ value, onChange, max, disabled, size = "md", label = "Quantity" }) {
  const small = size === "sm";
  const btn = `${small ? "h-8 w-8" : "h-10 w-10"} inline-flex items-center justify-center rounded-lg text-lg font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-700`;
  return (
    <div
      className="inline-flex items-center rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span
        className={`${small ? "w-8 text-sm" : "w-10 text-base"} text-center font-bold tabular-nums`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max ?? Infinity, value + 1))}
        disabled={disabled || (max != null && value >= max)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
