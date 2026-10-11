import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { adminApiFetch } from "@/lib/api";
import type { DirectoryEntity, DirectoryPage } from "@/lib/admin-directory";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const entities: DirectoryEntity[] = ["organization", "campaign", "user"];
const pages = [
  { name: "Overview", to: "/admin" as const },
  { name: "Organizations", to: "/admin/orgs" as const },
  { name: "Campaigns", to: "/admin/campaigns" as const },
  { name: "Users", to: "/admin/users" as const },
  { name: "Payouts", to: "/admin/payouts" as const },
  { name: "Activity log", to: "/admin/activity" as const },
  { name: "Settings", to: "/admin/settings" as const },
  { name: "My admin profile", to: "/admin/profile" as const },
];
export function AdminCommandPalette() {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const deferred = useDeferredValue(search.trim());
  const navigate = useNavigate();
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const typing =
        event.target instanceof Element &&
        event.target.closest("input, textarea, select, [contenteditable]");
      if (
        (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) ||
        (event.key === "/" && !typing)
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const queries = useQueries({
    queries: entities.map((entity) => ({
      queryKey: ["admin", "search", entity, deferred],
      queryFn: () =>
        adminApiFetch<DirectoryPage>(
          `/admin/review/directory/${entity}?search=${encodeURIComponent(deferred)}&pageSize=10&sort=name&direction=asc`,
        ),
      enabled: open && deferred.length >= 2,
    })),
  });
  const hits = search.trim()
    ? queries.flatMap((query, index) =>
        (query.data?.items ?? []).slice(0, 4).map((row) => ({
          key: `${entities[index]}:${row.id}`,
          name: row.name,
          meta: row.detail,
          go: () =>
            navigate({
              to:
                entities[index] === "organization"
                  ? "/admin/orgs/$id"
                  : entities[index] === "campaign"
                    ? "/admin/campaigns/$id"
                    : "/admin/users/$id",
              params: { id: row.id },
            }),
        })),
      )
    : pages.map((page) => ({
        key: page.to,
        name: page.name,
        meta: "Admin page",
        go: () => navigate({ to: page.to }),
      }));
  const pick = (index: number) => {
    if (
      search.trim() &&
      (search.trim().length < 2 ||
        deferred !== search.trim() ||
        queries.some((query) => query.isFetching))
    )
      return;
    const hit = hits[index];
    if (hit) {
      setOpen(false);
      setSearch("");
      setActive(0);
      void hit.go();
    }
  };
  return (
    <>
      <button
        className="giving-small-button"
        aria-label="Search admin records"
        onClick={() => setOpen(true)}
      >
        <Search size={15} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden text-xs text-muted-ink md:inline">Ctrl/Cmd K</kbd>
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setSearch("");
            setActive(0);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogTitle>Search admin records</DialogTitle>
          <DialogDescription>
            Find organizations, campaigns and users, or jump to an admin page.
          </DialogDescription>
          <input
            autoFocus
            className="giving-input"
            aria-label="Search organizations campaigns or users"
            placeholder="Name, location, email or phone"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((old) => Math.min(old + 1, Math.max(0, hits.length - 1)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((old) => Math.max(0, old - 1));
              } else if (event.key === "Enter") {
                event.preventDefault();
                pick(active);
              }
            }}
          />
          {search.trim().length === 1 ? (
            <p className="text-sm text-muted-ink">Enter at least two characters.</p>
          ) : queries.some((query) => query.isFetching) && search.trim() ? (
            <p role="status" className="text-sm">
              Searching...
            </p>
          ) : (
            <div className="max-h-[50dvh] overflow-y-auto">
              {hits.map((hit, index) => (
                <button
                  key={hit.key}
                  className={`block w-full rounded-lg p-3 text-left ${active === index ? "bg-panel" : "hover:bg-panel"}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(index)}
                >
                  <span className="block text-sm font-medium">{hit.name}</span>
                  <span className="block truncate text-xs text-muted-ink">{hit.meta}</span>
                </button>
              ))}
              {search.trim().length >= 2 &&
                !hits.length &&
                !queries.some((query) => query.isError) && (
                  <p className="p-4 text-sm text-muted-ink">No matching records.</p>
                )}
            </div>
          )}
          {search.trim().length >= 2 && queries.some((query) => query.isError) && (
            <div role="alert" className="text-sm text-red-700">
              Some records could not be searched.{" "}
              <button
                className="underline"
                onClick={() => {
                  for (const query of queries) if (query.isError) void query.refetch();
                }}
              >
                Retry
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
