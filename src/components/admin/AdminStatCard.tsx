import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CountUp } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

type Delta = { text: string; tone: "up" | "down" | "neutral" };

/** A headline number with one line of context. Links through when `to` is given. */
export function AdminStatCard({
  label,
  value,
  delta,
  to,
}: {
  label: string;
  value: string;
  delta?: Delta;
  to?: string;
}) {
  const body = (
    <>
      <p className="text-[13px] text-muted-ink">{label}</p>
      <p className="mt-3 font-display text-[clamp(26px,2.2vw,32px)] leading-none tracking-[-0.02em] text-ink">
        <CountUp value={value} />
      </p>
      {delta ? (
        <p
          className={cn(
            "mt-3 flex items-center gap-1 text-[13px]",
            delta.tone === "up" && "text-verified-ink",
            delta.tone === "down" && "text-danger",
            delta.tone === "neutral" && "text-muted-ink",
          )}
        >
          {delta.tone === "up" ? <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} /> : null}
          {delta.tone === "down" ? (
            <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2} />
          ) : null}
          {delta.text}
        </p>
      ) : null}
    </>
  );
  const shell = "block rounded-card border border-line-soft bg-paper p-5 transition-colors";
  return to ? (
    <Link to={to as "/admin"} className={cn(shell, "hover:border-line-input")}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}
