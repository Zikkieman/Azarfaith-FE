import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useAppSelector } from "@/app/hooks";

export function AuthHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8 space-y-3">
      <h1 className="text-[32px] font-medium leading-[1.15] tracking-tight">{title}</h1>
      <p className="text-[15px] leading-relaxed text-[#667085]">{children}</p>
    </div>
  );
}

export function AuthButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  // The local gate keeps the first client render identical to the server HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <button
      {...props}
      disabled={props.disabled || !mounted || !hydrated}
      className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#130e30] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#292247] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#130e30] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  return message ? (
    <p
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </p>
  ) : null;
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-4 text-xs text-[#667085]">
      <span className="h-px flex-1 bg-[#e4e7ec]" />
      or continue with email
      <span className="h-px flex-1 bg-[#e4e7ec]" />
    </div>
  );
}
