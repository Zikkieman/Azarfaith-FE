import { Link2 } from "lucide-react";
import { toast } from "sonner";

export function ShareCause({ path, title }: { path: string; title: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : "";
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      toast.success("Link copied. Share it with your supporters.");
    } catch {
      toast.error("Couldn't copy the link. Copy the address from your browser instead.");
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="public-button-outline" onClick={copy}>
        <Link2 className="h-4 w-4" />
        Copy link
      </button>
      <a
        className="public-button-outline"
        href={`https://wa.me/?text=${encodeURIComponent(`Support ${title} on AzarFaith: ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
    </div>
  );
}
