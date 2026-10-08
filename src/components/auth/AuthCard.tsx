import { cn } from "@/lib/utils";

export function AuthCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[503px] flex-col items-start gap-7 bg-paper sm:gap-[32px] sm:border sm:border-line-soft sm:p-[32px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
