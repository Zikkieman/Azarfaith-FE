import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Link2, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { Photo } from "@/components/app/Photo";
import { Segments } from "@/components/app/Segments";
import { Tag } from "./Tag";
import { btn } from "@/components/app/btn";
import { useLandingData as useApp } from "./data";
import { formatMoney } from "@/lib/catalog";
import { formatCompactMoney } from "./design-preview";
import type { LandingCampaign as Campaign } from "./data";
import { cn } from "@/lib/utils";

/** Latest word from the field in one quiet line: the newest update, or the newest gift. */
function Proof({ c }: { c: Campaign }) {
  const update = c.updates[0];
  const gift = c.donations[0];
  if (!update && !gift) return null;
  return (
    <p className="flex items-center gap-2 text-[13px] text-ink-soft">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
      <span className="truncate">
        {update ? update.title : `${gift.donor} gave ${formatMoney(gift.amount)}`}
      </span>
    </p>
  );
}

/** Campaign card: who is behind it, the latest proof, and progress you can trust. */
export function CampaignCard({
  campaign: c,
  compact = false,
}: {
  campaign: Campaign;
  /** Shorter photo and tighter spacing, for places that must fit one screen. */
  compact?: boolean;
}) {
  const org = useApp((s) => (c.orgId ? s.orgs.find((o) => o.id === c.orgId) : undefined));
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0;
  const verified = c.verificationStatus === "verified";
  const name = org?.name ?? c.raiser.name;
  const avatar = org?.photos[0] ?? c.raiser.avatar;
  const initials = c.donations.slice(0, 3).map((d) => d.donor.charAt(0).toUpperCase());

  const share = async () => {
    if (c.designPreview) {
      toast.info("This is a design preview. Open Discover to share a published campaign.");
      return;
    }
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(`${window.location.origin}/campaign/${c.id}`);
      toast.success("Campaign link copied");
    } catch {
      toast.error("Could not copy the link. Please try again.");
    }
  };

  return (
    <article className="group @container flex h-full w-full flex-col overflow-hidden rounded-card border border-line-soft bg-paper font-gsf transition-colors hover:border-line">
      <Link
        to={c.designPreview ? "/discover" : "/campaign/$id"}
        params={c.designPreview ? {} : { id: c.id }}
        className={cn(
          "relative block overflow-hidden",
          compact ? "aspect-[2/1] max-h-[17vh] w-full" : "aspect-[4/3]",
        )}
      >
        <Photo
          src={c.cover}
          className="absolute inset-0 bg-panel"
          imgClassName="halftone group-hover:scale-[1.03]"
        />
        {c.designPreview && (
          <span className="absolute right-3 top-3 rounded-full bg-paper px-2 py-1 text-[11px] text-ink-soft">
            Design preview
          </span>
        )}
        {c.urgency === "critical" || c.type === "emergency" ? (
          <span className="absolute left-3 top-3">
            <Tag tone="brand">Urgent</Tag>
          </span>
        ) : null}
      </Link>

      <div className={cn("flex flex-1 flex-col text-left", compact ? "gap-3 p-4" : "gap-4 p-5")}>
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-2 text-[13px] text-muted-ink">
            <img src={avatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
            <span className="truncate font-medium text-heading">{name}</span>
            {verified ? (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-verified"
                strokeWidth={2}
                aria-label="Verified"
              />
            ) : null}
          </p>
          <Link
            to={c.designPreview ? "/discover" : "/campaign/$id"}
            params={c.designPreview ? {} : { id: c.id }}
          >
            <h3 className="line-clamp-2 font-gsf text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-heading hover:underline">
              {c.title}
            </h3>
          </Link>
          {compact ? null : <Proof c={c} />}
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
            {c.mode === "ongoing" ? (
              <div className="flex flex-wrap gap-1.5">
                {(c.frequencies ?? ["monthly"]).map((f) => (
                  <Tag key={f}>
                    <Repeat2 className="h-3 w-3" strokeWidth={2} />
                    <span className="capitalize">{f}</span>
                  </Tag>
                ))}
              </div>
            ) : null}
            <p className="text-[13px] text-muted-ink">
              <span className="text-[15px] font-semibold text-heading">
                {formatMoney(c.raised)}
              </span>{" "}
              {c.mode === "ongoing" ? "given so far · ongoing support" : "given so far"}
            </p>
          </div>
        )}

        <div
          className={cn(
            "mt-auto flex items-center gap-3 border-t border-line-soft",
            compact ? "pt-3" : "pt-4",
          )}
        >
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
            className="press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line-input text-ink transition-colors hover:border-ink"
          >
            <Link2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <Link
            to={c.designPreview ? "/discover" : "/donate/$id"}
            params={c.designPreview ? {} : { id: c.id }}
            search={c.designPreview ? {} : { freq: "" }}
            className={btn("primary", "sm")}
          >
            Give <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </article>
  );
}
