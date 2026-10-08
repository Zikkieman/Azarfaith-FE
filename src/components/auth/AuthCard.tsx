import { cn } from "@/lib/utils";
import { flowTitleClass } from "@/components/app/AppShell";

/** The column every auth step sits in. No box: the page itself is the card. */
export function AuthCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex w-full flex-col gap-8", className)}>{children}</div>;
}

/** Title and one line of context at the top of an auth step. */
export function AuthHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className={flowTitleClass}>{title}</h1>
      {children ? <p className="text-[15px] leading-[1.6] text-ink-soft">{children}</p> : null}
    </div>
  );
}

/** "or sign in with email" between the social buttons and the form. */
export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line-soft" />
      <span className="text-[13px] text-muted-ink">{children}</span>
      <span className="h-px flex-1 bg-line-soft" />
    </div>
  );
}
