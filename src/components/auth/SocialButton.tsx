import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";

type SocialButtonProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "outline" | "solid";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Full-width auth button: outline for Google / Facebook, solid for the main action. */
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
      className={cn(btn(variant === "solid" ? "primary" : "secondary", "lg"), "w-full", className)}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
