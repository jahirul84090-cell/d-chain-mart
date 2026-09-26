import { Loader2 } from "lucide-react";

// Inline loading state for page content; header and footer stay visible.
export default function PageLoader({ label = "Loading…" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
