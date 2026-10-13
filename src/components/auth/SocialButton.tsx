import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";
import { useAuthReady } from "./useAuthReady";

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
  disabled,
  ...props
}: SocialButtonProps) {
  const ready = useAuthReady();
  return (
    <button
      type="button"
      className={cn(btn(variant === "solid" ? "primary" : "secondary", "lg"), "w-full", className)}
      {...props}
      disabled={disabled || !ready}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
