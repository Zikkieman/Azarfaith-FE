import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CornerDownLeft,
  History,
  Home,
  Search,
  Settings2,
  ShieldAlert,
  Wallet,
  Users,
  Building2,
  Megaphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/app/DesignDialog";
import { Photo } from "@/components/app/Photo";
import { cn } from "@/lib/utils";
import { adminApiFetch } from "@/lib/api";
import type { DirectoryEntity, DirectoryPage } from "@/lib/admin-directory";
import { usePalette } from "./AdminNavigationContext";
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

const entities: DirectoryEntity[] = ["organization", "campaign", "user"];
export function AdminCommandPalette() {
  const { paletteOpen, setPaletteOpen } = usePalette();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const deferred = useDeferredValue(q.trim());
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof Element &&
        e.target.closest("input, textarea, select, [contenteditable], [role=dialog]");
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [setPaletteOpen]);
  useEffect(() => {
    if (!paletteOpen) {
      setQ("");
      setActive(0);
    }
  }, [paletteOpen]);
  const queries = useQueries({
    queries: entities.map((entity) => ({
      queryKey: ["admin", "search", entity, deferred],
      queryFn: () =>
        adminApiFetch<DirectoryPage>(
          "/admin/review/directory/" +
            entity +
            "?search=" +
            encodeURIComponent(deferred) +
            "&pageSize=10&sort=name&direction=asc",
        ),
      enabled: paletteOpen && deferred.length >= 2,
    })),
  });
  const searching =
    deferred !== q.trim() || (Boolean(q.trim()) && queries.some((x) => x.isFetching));
  const page = (title: string, icon: LucideIcon, to: string, search?: object): Hit => ({
    key: title,
    group: "Go to",
    title,
    icon,
    go: () => {
      void navigate({ to: to as "/admin", search: search as never });
    },
  });
  const hits: Hit[] = q.trim()
    ? queries.flatMap((query, index) =>
        (query.data?.items ?? []).slice(0, 4).map((row) => ({
          key: entities[index] + ":" + row.id,
          group: ["Organizations", "Campaigns", "Users"][index],
          title: row.name,
          meta: row.detail,
          image: row.image ?? undefined,
          round: index === 2,
          go: () => {
            void navigate({
              to:
                index === 0
                  ? "/admin/orgs/$id"
                  : index === 1
                    ? "/admin/campaigns/$id"
                    : "/admin/users/$id",
              params: { id: row.id },
            });
          },
        })),
      )
    : [
        page("Overview", Home, "/admin"),
        page("Verify organizations", BadgeCheck, "/admin/orgs", { view: "pending" }),
        page("Review campaigns", ShieldAlert, "/admin/campaigns", { view: "pending" }),
        page("Organizations", Building2, "/admin/orgs", { view: "all" }),
        page("Campaigns", Megaphone, "/admin/campaigns", { view: "all" }),
        page("Users", Users, "/admin/users"),
        page("Activity log", History, "/admin/activity"),
        page("Settings", Settings2, "/admin/settings"),
        page("Payouts", Wallet, "/admin/payouts"),
      ];
  const pick = (h: Hit) => {
    if (q.trim() && (searching || q.trim().length < 2)) return;
    setPaletteOpen(false);
    h.go();
  };
  const groups = hits.reduce<Record<string, Hit[]>>((acc, h) => {
    (acc[h.group] ??= []).push(h);
    return acc;
  }, {});

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent className="top-[18%] max-w-[600px] translate-y-0 gap-0 overflow-hidden p-0 sm:p-0 max-sm:inset-x-3 max-sm:bottom-auto max-sm:top-3 max-sm:w-auto max-sm:rounded-card max-sm:border max-sm:pb-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-3 border-b border-line-soft px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-ink" strokeWidth={1.75} />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
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
            aria-label="Search organizations campaigns or users"
            placeholder="Search organizations, campaigns, people or pages"
            className="h-14 min-w-0 flex-1 bg-transparent font-gsf text-[15px] text-ink placeholder:text-subtle focus:outline-none"
          />
          <kbd className="hidden rounded-[5px] border border-line-soft bg-panel px-1.5 py-0.5 font-gsf text-[11px] text-muted-ink sm:block">
            esc
          </kbd>
          <button
            type="button"
            onClick={() => setPaletteOpen(false)}
            className="font-gsf text-sm font-medium text-ink-soft sm:hidden"
          >
            Cancel
          </button>
        </div>

        <DialogDescription className="sr-only">
          Search real admin records or open an admin page.
        </DialogDescription>
        {q.trim().length === 1 ? (
          <p className="p-4 text-sm text-muted-ink">Enter at least two characters.</p>
        ) : searching ? (
          <p role="status" className="p-4 text-sm text-muted-ink">
            Searching...
          </p>
        ) : queries.some((x) => x.isError) && q.trim().length >= 2 ? (
          <div role="alert" className="p-4 text-sm text-danger">
            Some records could not be searched.{" "}
            <button
              onClick={() => {
                for (const query of queries) if (query.isError) void query.refetch();
              }}
              className="underline"
            >
              Retry
            </button>
          </div>
        ) : null}
        <div className="max-h-[min(420px,60vh)] overflow-y-auto p-2 font-gsf">
          {hits.length === 0 &&
          !searching &&
          !queries.some((x) => x.isError) &&
          q.trim().length !== 1 ? (
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
                        <Photo
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

        <div className="hidden items-center gap-4 border-t border-line-soft bg-panel/60 px-4 py-2.5 font-gsf text-[12px] text-muted-ink sm:flex">
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
