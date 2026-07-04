import { Loader2 } from "lucide-react";

export function PageSpinner({
  label = "Loading...",
  fullScreen = true,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={fullScreen ? "flex min-h-[60vh] items-center justify-center px-6" : "flex items-center justify-center py-16"}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}
