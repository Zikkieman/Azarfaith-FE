import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { cn } from "@/lib/utils";

const backdrop =
  "https://images.unsplash.com/photo-1604072366376-63d46248927e?auto=format&fit=crop&w=1400&q=70";

/**
 * Focused set-up flow (after GlideOS's onboarding): one card, the form on the left with step
 * dashes, and on the right a live preview of what they're making, set on a photo.
 */
export function OnboardingShell({
  steps,
  current,
  exitLabel = "Save and exit",
  onExit,
  busy,
  preview,
  previewLabel = "Preview",
  footer,
  children,
}: {
  steps: string[];
  current: number;

  exitLabel?: string;
  onExit?: () => void;
  busy?: boolean;
  preview: ReactNode;
  previewLabel?: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="designer-app flex min-h-screen flex-col bg-panel font-gsf text-heading">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" aria-label="AzarFaith home">
          <AuthLogo />
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
        >
          {exitLabel} <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-3 pb-6 sm:px-6 lg:items-center lg:pb-10">
        <div className="admin-rise grid w-full max-w-[1120px] overflow-hidden rounded-card bg-paper shadow-[0_32px_80px_-32px_rgba(19,14,48,0.3)] lg:min-h-[640px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-col gap-3 px-6 pt-7 sm:px-10 sm:pt-9">
              <ol
                className="flex items-center gap-1.5"
                aria-label={`Step ${current + 1} of ${steps.length}`}
              >
                {steps.map((s, i) => (
                  <li
                    key={s}
                    title={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === current
                        ? "w-8 bg-ink"
                        : i < current
                          ? "w-4 bg-ink/40"
                          : "w-4 bg-line-soft",
                    )}
                  />
                ))}
              </ol>
              <p className="text-[13px] text-muted-ink">
                Step {current + 1} of {steps.length}:{" "}
                <span className="font-medium text-ink">{steps[current]}</span>
              </p>
            </div>
            <div key={current} className="admin-rise flex-1 px-6 py-6 sm:px-10">
              {children}
            </div>
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-line-soft bg-paper px-6 py-4 sm:px-10">
              {footer}
            </div>
          </div>

          <aside className="relative hidden overflow-hidden lg:block">
            <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" />
            <div className="relative flex h-full flex-col items-center justify-center gap-3 p-10">
              <p className="self-start rounded-full bg-paper/90 px-3 py-1 text-[12px] font-medium text-ink">
                {previewLabel}
              </p>
              <div className="w-full max-w-[380px]">{preview}</div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
