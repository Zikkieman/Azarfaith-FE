import { cn } from "@/lib/utils";

type SocialButtonProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "outline" | "solid";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SocialButton({
  icon,
  children,
  variant = "outline",
  className,
  ...props
}: SocialButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-[8px] px-4 py-3 text-sm font-semibold leading-5 transition-colors",
        variant === "outline"
          ? "border border-line-soft bg-paper text-heading hover:bg-muted"
          : "bg-btn text-btn-fg hover:bg-btn/90",
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
