import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BadgeCheck, Building2, CalendarClock, MapPin, ReceiptText, Repeat2 } from "lucide-react";
import { CampaignCard } from "@/components/CampaignCard";
import { Photo } from "@/components/app/Photo";
import { useApp } from "@/lib/store";
import { formatMoney, type Campaign, type Org } from "@/lib/domain";

type Data = { campaign: Campaign; orgs: Org[] };
type Feature = {
  title: string;
  body: string;
  cta: { label: string; to: string };
  photo: (d: Data) => string;
  card: (d: Data) => ReactNode;
};

const cardShell = "w-full max-w-[400px] rounded-xl border border-line-soft bg-paper p-5";

const features: Feature[] = [
  {
    title: "Reach More Donors",
    body: "Keep every campaign organized from start to finish with one dashboard for donors, updates, receipts, history, and impact context.",
    cta: { label: "Register Org", to: "/register-org" },
    photo: (d) => d.campaign.gallery[1] ?? d.campaign.cover,
    card: (d) => (
      <div className="w-full max-w-[400px]">
        <CampaignCard campaign={d.campaign} />
      </div>
    ),
  },
  {
    title: "Discover",
    body: "Givers find verified churches, missionaries, orphanages and schools by cause, place or denomination.",
    cta: { label: "Browse causes", to: "/discover" },
    photo: (d) => d.orgs[2]?.photos[0] ?? d.campaign.cover,
    card: (d) => (
      <ul className={`${cardShell} flex flex-col divide-y divide-line-soft py-2`}>
        {d.orgs.slice(0, 3).map((o) => (
          <li key={o.id} className="flex items-center gap-3 py-3">
            <Photo src={o.photos[0]} className="h-11 w-11 shrink-0 rounded-lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-heading">
                {o.name}
              </span>
              <span className="flex items-center gap-1 text-[13px] text-muted-ink">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {o.location}
              </span>
            </span>
            <BadgeCheck className="h-5 w-5 shrink-0 text-[#00B67A]" strokeWidth={1.5} />
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: "Build Trust Instantly",
    body: "Every organization is checked before it can receive gifts, and carries a verified badge givers can see.",
    cta: { label: "How verification works", to: "/verification" },
    photo: (d) => d.orgs[0]?.photos[0] ?? d.campaign.cover,
    card: (d) => (
      <div className={`${cardShell} flex flex-col gap-4`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-panel-olive text-ink">
            <BadgeCheck className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <span>
            <span className="block text-[15px] font-semibold text-heading">{d.orgs[0]?.name}</span>
            <span className="text-[13px] text-muted-ink">Verified organization</span>
          </span>
        </div>
        <ul className="flex flex-col gap-2.5 border-t border-line-soft pt-4 text-sm text-ink-soft">
          {[
            "Registration documents checked",
            "Bank account name matched",
            "Leadership confirmed by phone",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#00B67A]" strokeWidth={1.5} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: "Track Donations",
    body: "Every gift, receipt and update sits in one giving history, so givers always know where their money went.",
    cta: { label: "See my giving", to: "/my-giving" },
    photo: (d) => d.orgs[1]?.photos[0] ?? d.campaign.cover,
    card: (d) => (
      <ul className={`${cardShell} flex flex-col divide-y divide-line-soft py-2`}>
        {d.orgs.slice(0, 3).map((org) => (
          <li key={org.id} className="flex items-center gap-3 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-ink-soft">
              <ReceiptText className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-heading">
                {org.name}
              </span>
              <span className="text-[13px] text-muted-ink">Verified organization</span>
            </span>
            <span className="text-[15px] font-semibold text-heading">{formatMoney(org.totalReceived)}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: "Easy payouts",
    body: "Gifts land in your verified account on a clear schedule, with a 2.5% platform fee and nothing hidden.",
    cta: { label: "About payouts", to: "/payouts" },
    photo: (d) => d.campaign.gallery[2] ?? d.campaign.cover,
    card: (d) => (
      <div className={`${cardShell} flex flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-ink">Payouts</span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-ink">
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} /> Review required
          </span>
        </div>
        <p className="font-display text-[25px] leading-none text-heading">Released to verified accounts</p>
        <div className="flex items-center gap-2.5 rounded-lg bg-panel px-3 py-2.5 text-sm text-ink-soft">
          <Building2 className="h-4 w-4" strokeWidth={1.5} /> Account details are protected
        </div>
        <dl className="flex flex-col gap-1.5 border-t border-line-soft pt-3 text-[13px] text-muted-ink">
          <div className="flex justify-between">
            <dt>Campaign raised</dt>
            <dd>{formatMoney(d.campaign.raised)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Platform fee (2.5%)</dt>
            <dd>Shown before payment</dd>
          </div>
        </dl>
      </div>
    ),
  },
];

/** Scroll distance each feature owns while the section is pinned. */
const STEP_SVH = 55;

/**
 * Pinned feature list (pattern from Modash). On large screens the section pins and scrolling
 * walks through the five features while the media crossfades; clicking a title jumps there.
 * Below `lg` it is a plain accordion.
 */
export function FeaturePanel() {
  const [active, setActive] = useState(0);
  const triggers = useRef<(HTMLDivElement | null)[]>([]);
  const campaigns = useApp((s) => s.campaigns);
  const orgs = useApp((s) => s.orgs);
  const data: Data = { campaign: campaigns.find((c) => c.goal) ?? campaigns[0], orgs };

  if (!data.campaign) return null;

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    triggers.current.forEach((t) => t && io.observe(t));
    return () => io.disconnect();
  }, []);

  const select = (i: number) => {
    const trigger = triggers.current[i];
    if (trigger && window.matchMedia("(min-width: 1024px)").matches) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      trigger.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
    } else {
      setActive(i);
    }
  };

  return (
    <section
      className="relative w-full"
      style={
        { "--pin-h": `calc(100svh + ${(features.length - 1) * STEP_SVH}svh)` } as CSSProperties
      }
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hidden lg:block">
        {features.map((f, i) => (
          <div
            key={f.title}
            ref={(el) => {
              triggers.current[i] = el;
            }}
            data-index={i}
            style={{ height: `${STEP_SVH}svh` }}
          />
        ))}
      </div>

      <div className="lg:h-[var(--pin-h)]">
        <div className="grid grid-cols-1 lg:sticky lg:top-0 lg:h-svh lg:grid-cols-[minmax(0,868fr)_minmax(0,860fr)]">
          <div className="flex flex-col bg-panel px-6 py-12 sm:px-10 lg:justify-center lg:px-[clamp(40px,4vw,72px)] lg:py-16">
            {features.map((feature, i) => {
              const isActive = active === i;
              return (
                <div
                  key={feature.title}
                  className="max-w-[788px] border-t border-line-soft first:border-t-0"
                >
                  <button
                    type="button"
                    onClick={() => select(i)}
                    aria-expanded={isActive}
                    className={`w-full py-3 text-left font-gsf text-[clamp(26px,2.32vw,40px)] leading-[1.3] tracking-[-0.02em] text-heading transition-opacity duration-300 ${
                      isActive ? "opacity-100" : "opacity-30 hover:opacity-60"
                    }`}
                  >
                    {feature.title}
                  </button>
                  <div className="expand" data-open={isActive ? "" : undefined}>
                    <div>
                      <div className="flex flex-col gap-8 pb-10 pt-2">
                        <p className="max-w-[640px] font-gsf text-[clamp(17px,1.16vw,20px)] leading-7 text-ink-soft">
                          {feature.body}
                        </p>
                        <div>
                          <Link
                            to={feature.cta.to}
                            tabIndex={isActive ? 0 : -1}
                            className="press inline-flex items-center rounded-xl bg-btn px-8 py-3 font-gsf text-[clamp(17px,1.16vw,20px)] font-semibold leading-7 text-btn-fg transition-opacity hover:opacity-90 sm:px-12"
                          >
                            {feature.cta.label}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative hidden overflow-hidden bg-paper lg:block">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                aria-hidden={active !== i}
                className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
                  active === i ? "opacity-100" : "pointer-events-none scale-[1.03] opacity-0"
                }`}
              >
                <Photo
                  src={feature.photo(data)}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="absolute inset-0"
                />
                <div className="absolute inset-0 flex items-end p-[clamp(32px,4vw,72px)]">
                  {feature.card(data)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
