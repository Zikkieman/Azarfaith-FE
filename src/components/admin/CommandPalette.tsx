import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CornerDownLeft,
  History,
  Home,
  Search,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { usePalette } from "./context";

type Hit = {
  key: string;
  group: string;
  title: string;
  meta?: string;
  image?: string;
  round?: boolean;
  icon?: LucideIcon;
  go: () => void;
};

/** ⌘K: jump to any organization, campaign, user or admin page from anywhere. */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = usePalette();
  const orgs = useApp((s) => s.orgs);
  const campaigns = useApp((s) => s.campaigns);
  const users = useApp((s) => s.users);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof Element &&
        e.target.closest("input, textarea, select, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  useEffect(() => {
    if (!paletteOpen) setQ("");
  }, [paletteOpen]);
  useEffect(() => setActive(0), [q]);

  const hits = useMemo<Hit[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) {
      const page = (title: string, icon: LucideIcon, to: string, search?: object): Hit => ({
        key: title,
        group: "Go to",
        title,
        icon,
        go: () => navigate({ to: to as "/admin", search: search as never }),
      });
      return [
        page("Overview", Home, "/admin"),
        page("Verify organizations", BadgeCheck, "/admin/orgs", { view: "pending" }),
        page("Review campaigns", ShieldAlert, "/admin/campaigns", { view: "pending" }),
        page("Activity log", History, "/admin/activity"),
        page("Settings", Settings2, "/admin/settings"),
      ];
    }
    const has = (...xs: string[]) => xs.some((x) => x.toLowerCase().includes(t));
    return [
      ...orgs
        .filter((o) => has(o.name, o.location, o.denomination))
        .slice(0, 4)
        .map<Hit>((o) => ({
          key: `o-${o.id}`,
          group: "Organizations",
          title: o.name,
          meta: o.location,
          image: o.photos[0],
          go: () => navigate({ to: "/admin/orgs/$id", params: { id: o.id } }),
        })),
      ...campaigns
        .filter((c) => has(c.title, c.raiser.name, c.location))
        .slice(0, 4)
        .map<Hit>((c) => ({
          key: `c-${c.id}`,
          group: "Campaigns",
          title: c.title,
          meta: c.raiser.name,
          image: c.cover,
          go: () => navigate({ to: "/admin/campaigns/$id", params: { id: c.id } }),
        })),
      ...users
        .filter((u) => has(u.name, u.email, u.phone))
        .slice(0, 4)
        .map<Hit>((u) => ({
          key: `u-${u.id}`,
          group: "Users",
          title: u.name,
          meta: u.email,
          image: u.avatar,
          round: true,
          go: () => navigate({ to: "/admin/users/$id", params: { id: u.id } }),
        })),
    ];
  }, [q, orgs, campaigns, users, navigate]);

  const pick = (h: Hit) => {
    setPaletteOpen(false);
    h.go();
  };

  const groups = hits.reduce<Record<string, Hit[]>>((acc, h) => {
    (acc[h.group] ??= []).push(h);
    return acc;
  }, {});

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent className="top-[18%] max-w-[600px] translate-y-0 gap-0 overflow-hidden p-0 sm:p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-3 border-b border-line-soft px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-ink" strokeWidth={1.75} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, hits.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && hits[active]) {
                e.preventDefault();
                pick(hits[active]);
              }
            }}
            placeholder="Search organizations, campaigns, people or pages"
            className="h-14 flex-1 bg-transparent font-gsf text-[15px] text-ink placeholder:text-subtle focus:outline-none"
          />
          <kbd className="rounded-[5px] border border-line-soft bg-panel px-1.5 py-0.5 font-gsf text-[11px] text-muted-ink">
            esc
          </kbd>
        </div>

        <div className="max-h-[min(420px,60vh)] overflow-y-auto p-2 font-gsf">
          {hits.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-ink">
                No results for &ldquo;{q.trim()}&rdquo;
              </p>
              <p className="mt-1 text-[13px] text-muted-ink">
                Try a name, a place, an email or a phone number.
              </p>
            </div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="pb-1">
                <p className="px-3 pb-1 pt-2 text-[12px] font-medium text-subtle">{group}</p>
                {items.map((h) => {
                  const i = hits.indexOf(h);
                  return (
                    <button
                      key={h.key}
                      type="button"
                      onMouseMove={() => setActive(i)}
                      onClick={() => pick(h)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left",
                        i === active ? "bg-panel" : "",
                      )}
                    >
                      {h.image ? (
                        <img
                          src={h.image}
                          alt=""
                          className={cn(
                            "h-7 w-7 shrink-0 object-cover",
                            h.round ? "rounded-full" : "rounded-[6px]",
                          )}
                        />
                      ) : h.icon ? (
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-panel text-ink-soft">
                          <h.icon className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{h.title}</span>
                        {h.meta ? (
                          <span className="block truncate text-[12px] text-muted-ink">
                            {h.meta}
                          </span>
                        ) : null}
                      </span>
                      {i === active ? (
                        <CornerDownLeft className="h-3.5 w-3.5 text-muted-ink" strokeWidth={2} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line-soft bg-panel/60 px-4 py-2.5 font-gsf text-[12px] text-muted-ink">
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
          </span>
          <span>
            <Kbd>↵</Kbd> to open
          </span>
          <span className="ml-auto">
            <Kbd>/</Kbd> opens search anywhere
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded-[4px] border border-line-soft bg-paper px-1 font-gsf text-[11px]">
      {children}
    </kbd>
  );
}
