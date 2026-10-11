import { AlertCircle } from "lucide-react";

export function AdminLoadError({
  retry,
  message = "Could not load this information. Please try again.",
}: {
  retry: () => void;
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium"
      >
        Retry
      </button>
    </div>
  );
}
