import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ArrowRight, BadgeCheck, Link2, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { Photo } from "@/components/app/Photo";
import { useInView } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { formatCompactMoney, formatMoney, type Campaign } from "@/lib/mock";
import { cn } from "@/lib/utils";

const SEGMENTS = 20;

/** Goal progress drawn as receipt-style perforations that fill one by one on view. */
function Segments({ pct }: { pct: number }) {
  const [ref, inView] = useInView<HTMLDivElement>("0px");
  const on = Math.round((pct / 100) * SEGMENTS);
  return (
    <div
      ref={ref}
      data-segments=""
      data-shown={inView ? "" : undefined}
      className="flex gap-[3px]"
      role="img"
      aria-label={`${pct}% funded`}
    >
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span
          key={i}
          data-on={i < on ? "" : undefined}
          style={{ "--i": i } as CSSProperties}
          className={cn("h-2 flex-1 rounded-[2px]", i < on ? "bg-[#FE5102]" : "bg-line-soft")}
        />
      ))}
    </div>
  );
}

/** Latest word from the field in one quiet line: the newest update, or the newest gift. */
function Proof({ c }: { c: Campaign }) {
  const update = c.updates[0];
  const gift = c.donations[0];
  if (!update && !gift) return null;
  return (
    <p className="flex items-center gap-2 text-[13px] text-ink-soft">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FE5102]" />
      <span className="truncate">
        {update ? update.title : `${gift.donor} gave ${formatMoney(gift.amount)}`}
      </span>
    </p>
  );
}

/** Campaign card: who is behind it, the latest proof, and progress you can trust. */
export function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const org = useApp((s) => (c.orgId ? s.orgs.find((o) => o.id === c.orgId) : undefined));
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0;
  const verified = c.verificationStatus === "verified";
  const name = org?.name ?? c.raiser.name;
  const avatar = org?.photos[0] ?? c.raiser.avatar;
  const initials = c.donations.slice(0, 3).map((d) => d.donor.charAt(0).toUpperCase());

  const share = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/campaign/${c.id}`);
    toast("Campaign link copied");
  };

  return (
    <article className="group @container flex h-full w-full flex-col overflow-hidden rounded-[20px] border border-line-soft bg-paper font-gsf transition-colors hover:border-line">
      <Link
        to="/campaign/$id"
        params={{ id: c.id }}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <Photo
          src={c.cover}
          className="absolute inset-0"
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />
        {c.urgency === "critical" || c.type === "emergency" ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#FE5102] px-2.5 py-1 text-[12px] font-semibold text-white">
            Urgent
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-2 text-[13px] text-muted-ink">
            <img src={avatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
            <span className="truncate font-medium text-heading">{name}</span>
            {verified ? (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-[#00B67A]"
                strokeWidth={2}
                aria-label="Verified"
              />
            ) : null}
          </p>
          <Link to="/campaign/$id" params={{ id: c.id }}>
            <h3 className="line-clamp-2 min-h-[48px] font-gsf text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-heading hover:underline">
              {c.title}
            </h3>
          </Link>
          <Proof c={c} />
        </div>

        {c.goal ? (
          <div className="flex flex-col gap-2">
            <Segments pct={pct} />
            <p className="flex items-baseline justify-between gap-3 text-[13px] text-muted-ink">
              <span>
                <span className="text-[15px] font-semibold text-heading">
                  {formatMoney(c.raised)}
                </span>{" "}
                of {formatCompactMoney(c.goal)}
              </span>
              <span className="font-semibold text-heading">{pct}%</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(c.frequencies ?? ["monthly"]).map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 text-[12px] font-medium capitalize text-ink-soft"
                >
                  <Repeat2 className="h-3 w-3" strokeWidth={2} /> {f}
                </span>
              ))}
            </div>
            <p className="text-[13px] text-muted-ink">
              <span className="text-[15px] font-semibold text-heading">
                {formatMoney(c.raised)}
              </span>{" "}
              given so far · ongoing support
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center gap-3 border-t border-line-soft pt-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {initials.length ? (
              <span className="flex -space-x-2 @max-[360px]:hidden">
                {initials.map((ch, i) => (
                  <span
                    key={i}
                    className="grid h-7 w-7 place-items-center rounded-full border-2 border-paper bg-panel text-[11px] font-semibold text-ink-soft"
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ) : null}
            <span className="truncate text-[13px] text-muted-ink">
              <span className="font-semibold text-heading">{c.donors.toLocaleString()}</span>{" "}
              {c.donors === 1 ? "giver" : "givers"}
            </span>
          </div>
          <button
            type="button"
            onClick={share}
            aria-label="Copy campaign link"
            className="press grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink"
          >
            <Link2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <Link
            to="/donate/$id"
            params={{ id: c.id }}
            search={{ freq: "" }}
            className="press inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-btn px-4 text-[14px] font-semibold text-btn-fg transition-opacity hover:opacity-90"
          >
            Give <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </article>
  );
}
