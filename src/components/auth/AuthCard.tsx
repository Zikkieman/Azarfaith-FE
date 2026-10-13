import { cn } from "@/lib/utils";

export function AuthCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex w-full flex-col gap-8", className)}>{children}</div>;
}
export function AuthHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-[clamp(28px,2.6vw,40px)] leading-[1.12] tracking-[-0.03em] text-ink">
        {title}
      </h1>
      {children ? <p className="text-[15px] leading-[1.6] text-ink-soft">{children}</p> : null}
    </div>
  );
}
export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line-soft" />
      <span className="text-[13px] text-muted-ink">{children}</span>
      <span className="h-px flex-1 bg-line-soft" />
    </div>
  );
}
