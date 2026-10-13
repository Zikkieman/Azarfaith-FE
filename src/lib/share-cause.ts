import { toast } from "sonner";

/** Never share a checkout reference or claim a clipboard write succeeded before it did. */
export async function shareCause(
  kind: "campaign" | "org",
  id: string,
  title: string,
  copyOnly = false,
) {
  const url = new URL("/" + kind + "/" + encodeURIComponent(id), window.location.origin).href;
  try {
    if (!copyOnly && navigator.share) await navigator.share({ title, url });
    else {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      toast.success(kind === "org" ? "Organization link copied" : "Campaign link copied");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return;
    toast.error("Could not share this link. Please copy the address from your browser.");
  }
}
