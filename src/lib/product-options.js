// Product sizes and colours are stored as comma-separated text
// (e.g. "S, M, L"). These helpers keep parsing identical everywhere.

export function parseOptions(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return [...new Set(String(value ?? "").split(",").map((v) => v.trim()).filter(Boolean))];
}

// Normalises admin input to a clean "A, B, C" string (or null when empty).
export function formatOptions(value) {
  const list = parseOptions(value);
  return list.length ? list.join(", ") : null;
}

// Common colour names customers use that browsers don't know, mapped to CSS.
const COLOR_ALIASES = {
  "midnight black": "#111827",
  "jet black": "#0a0a0a",
  "space gray": "#4b5563",
  "space grey": "#4b5563",
  graphite: "#3f3f46",
  "rose gold": "#e8b4a0",
  champagne: "#f7e7ce",
  "sky blue": "#87ceeb",
  "sea blue": "#006994",
  "ocean blue": "#1f6fb2",
  "army green": "#4b5320",
  "mint green": "#98ff98",
  "off white": "#f8f8f2",
  cream: "#fffdd0",
  titanium: "#8a8d8f",
  "natural titanium": "#b9b4a9",
  "desert titanium": "#c6a98a",
  multicolor: "linear-gradient(135deg,#f43f5e,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
  multicolour: "linear-gradient(135deg,#f43f5e,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
};

/**
 * Returns a CSS background for a colour name, or null if it can't be shown
 * as a swatch (the UI then shows a text chip instead).
 */
export function colorToCss(name) {
  const raw = String(name ?? "").trim();
  if (!raw) return null;
  const key = raw.toLowerCase();
  if (COLOR_ALIASES[key]) return COLOR_ALIASES[key];
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;

  const supports = (v) =>
    typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("color", v);

  const compact = key.replace(/\s+/g, "");
  if (supports(compact)) return compact;
  // "Dark Forest Green" → try "forestgreen", then "green".
  const words = key.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const tail = words.slice(i).join("");
    if (supports(tail)) return tail;
  }
  return null;
}

// Light colours need a visible border so they don't vanish on white.
export function isLightColor(css) {
  if (!css || css.startsWith("linear-gradient")) return false;
  const light = ["white", "#fff", "#ffffff", "ivory", "snow", "cream", "#fffdd0", "#f8f8f2", "beige", "#f7e7ce", "linen", "whitesmoke", "lightyellow", "yellow"];
  return light.includes(css.toLowerCase());
}
