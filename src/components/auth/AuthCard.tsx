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
        "flex w-full max-w-[503px] flex-col items-start gap-[32px] border border-[#ebebeb] bg-white p-[32px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
