import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative h-12 w-12">
        <Loader2 className="absolute inset-0 h-full w-full animate-spin text-purple-600" />
        <div className="absolute inset-0 h-full w-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-purple-600 opacity-75"></div>
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-in slide-in-from-top-2">
        Loading content...
      </p>
    </div>
  );
}
