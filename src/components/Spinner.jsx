import { Loader2 } from "lucide-react";

export default function Spinner({
  loading,
  mode = "fullscreen",
  size = 24,
  className = "",
}) {
  //   if (!loading) return null;

  if (mode === "fullscreen") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50 animate-in fade-in duration-300">
        <Loader2
          className={`h-${size / 4} w-${
            size / 4
          } text-blue-600 animate-spin ${className}`}
          aria-label="Loading content"
        />
      </div>
    );
  }

  return (
    <Loader2
      className={`h-${size / 4} w-${
        size / 4
      } text-blue-600 animate-spin ${className}`}
      aria-label="Loading"
    />
  );
}
