import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "quiet";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ink-contrast hover:bg-ink/90",
  secondary: "border border-line-input bg-paper text-ink hover:border-ink",
  quiet: "text-ink hover:bg-panel",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

/** Button classes. One shape (fully round), three variants, three sizes. */
export function btn(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-gsf font-semibold tracking-[-0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
  );
}

export const btnPrimary = btn("primary");
export const btnSecondary = btn("secondary");
