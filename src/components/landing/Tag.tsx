import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "verified" | "attention" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-panel text-ink-soft",
  brand: "bg-brand text-white",
  verified: "bg-verified/10 text-verified-ink",
  attention: "bg-brand/10 text-brand-ink",
  danger: "bg-danger/10 text-danger",
};

/** Small status label: Automatic, Unverified, Urgent, Latest. */
export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 font-gsf text-xs font-medium leading-5",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
