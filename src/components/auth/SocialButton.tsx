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
          ? "border border-[#ededed] bg-white text-[#344054] hover:bg-muted"
          : "bg-black text-white hover:bg-black/90",
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
