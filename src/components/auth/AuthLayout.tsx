import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { AuthLogo } from "./AuthLogo";

const photo =
  "https://images.unsplash.com/photo-1710093072218-0024b8391475?auto=format&fit=crop&w=1400&q=80";

/** Original designer frame with the application auth routes wired in. */
export function AuthLayout({
  prompt,
  linkLabel,
  linkTo,
  returnTo,
  children,
}: {
  prompt: string;
  linkLabel: string;
  linkTo: "/login" | "/signup";
  returnTo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="designer-auth min-h-screen bg-paper font-gsf text-heading lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-4 py-6">
          <Link to="/" aria-label="AzarFaith home">
            <AuthLogo />
          </Link>
          <p className="text-sm text-ink-soft">
            <span className="hidden sm:inline">{prompt} </span>
            <Link
              to={linkTo}
              search={linkTo === "/signup" ? { mode: "choose", returnTo } : { returnTo }}
              className="font-semibold text-ink underline decoration-1 underline-offset-4"
            >
              {linkLabel}
            </Link>
          </p>
        </header>
        <main className="flex flex-1 items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>
      </div>
      <aside className="hidden p-4 lg:block">
        <div className="sticky top-4 h-[calc(100svh-32px)] overflow-hidden rounded-card bg-panel">
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.opacity = "0";
            }}
          />
          <div className="absolute inset-x-6 bottom-6 flex max-w-[400px] flex-col gap-2 rounded-card bg-paper p-5">
            <p className="flex items-center gap-2 text-[13px] text-muted-ink">
              Grace Harvest Orphanage, Jos{" "}
              <span className="inline-flex items-center gap-1 font-gsf text-[13px] font-medium text-verified-ink">
                <BadgeCheck
                  className="h-4 w-4 text-verified"
                  strokeWidth={2}
                  aria-label="Sample verified badge"
                />
              </span>
            </p>
            <p className="font-display text-[20px] leading-[1.3] tracking-[-0.01em] text-ink">
              All 20 bunk beds delivered and assembled.
            </p>
            <p className="text-[13px] text-muted-ink">
              An update sent to every giver who made it happen.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
