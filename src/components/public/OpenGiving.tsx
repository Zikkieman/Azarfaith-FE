import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { VIEW, dots, states } from "./nigeria";
import { CatalogError } from "./PublicShell";

export type GivingOverview = {
  since: string;
  until: string;
  totals: { given: number; gifts: number; organizations: number };
  locations: { location: string; given: number; gifts: number; organizations: number }[];
};
function locationState(location: string) {
  const words = location
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/\b(fct|abuja|federal capital territory)\b/.test(words)) return "FC";
  return (
    states.find((state) => new RegExp(`\\b${state.name.toLowerCase()}\\b`).test(words))?.id ??
    "other"
  );
}
export function OpenGiving() {
  const [selected, setSelected] = useState("all");
  const query = useQuery({
    queryKey: ["public-giving"],
    queryFn: () => apiFetch<GivingOverview>("/public/giving"),
    refetchInterval: 60000,
  });
  if (query.isPending)
    return (
      <p role="status" className="p-8 text-center">
        Loading giving overview...
      </p>
    );
  if (query.isError) return <CatalogError retry={() => void query.refetch()} />;
  const rows = query.data.locations.filter(
    (row) => selected === "all" || locationState(row.location) === selected,
  );
  const metrics = rows.reduce(
    (sum, row) => ({
      given: sum.given + row.given,
      gifts: sum.gifts + row.gifts,
      organizations: sum.organizations + row.organizations,
    }),
    { given: 0, gifts: 0, organizations: 0 },
  );
  const active = new Set(
    query.data.locations
      .filter((row) => row.organizations > 0 || row.gifts > 0)
      .map((row) => locationState(row.location)),
  );
  return (
    <section
      aria-label="Open giving across Nigeria"
      className="public-panel overflow-hidden p-5 md:p-10"
    >
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-orange-700">
        Open giving
      </p>
      <h2 className="mt-3 font-display text-3xl md:text-5xl">See where giving reaches.</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
        Confirmed gifts to currently published campaigns over the last seven days. Locations come
        from campaign and organization profiles, not donor addresses.
      </p>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl bg-stone-50 p-4">
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            role="img"
            aria-label="Nigeria schematic showing states with published giving activity"
            className="w-full"
          >
            {dots.map((dot, index) => (
              <circle
                key={index}
                cx={dot.x}
                cy={dot.y}
                r={1.7}
                fill={
                  selected === dot.state ? "#130e30" : active.has(dot.state) ? "#fe5102" : "#dedbe2"
                }
              />
            ))}
          </svg>
          <p className="mt-3 text-xs text-muted-ink">
            Schematic map; state boundaries and locations are approximate.
          </p>
        </div>
        <div className="min-w-0">
          <label className="giving-label">
            View state
            <select
              aria-label="View state"
              className="public-input"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="all">All locations</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
              <option value="other">Other or unspecified state</option>
            </select>
          </label>
          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <dt className="text-xs text-muted-ink">Given in the last seven days</dt>
              <dd className="mt-1 break-words font-display text-4xl">
                {formatMoney(metrics.given)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-ink">Confirmed gifts</dt>
              <dd className="mt-1 text-2xl font-semibold">{metrics.gifts}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-ink">Verified organizations</dt>
              <dd className="mt-1 text-2xl font-semibold">{metrics.organizations}</dd>
            </div>
          </dl>
          {!rows.length && (
            <p className="mt-6 text-sm text-muted-ink">
              No published activity for this location yet.
            </p>
          )}
          <Link to="/discover" className="public-button mt-8">
            Find a cause to support
          </Link>
        </div>
      </div>
    </section>
  );
}
