import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BadgeCheck, CalendarClock, Megaphone, ReceiptText, Repeat2 } from "lucide-react";

const unsplash = (id: string, w = 700) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

type Item =
  | { kind: "photo"; src: string; caption: string }
  | { kind: "proof"; icon: typeof BadgeCheck; label: string; body: ReactNode };

/** Photos of the work, interleaved with what the giver sees: the gift, the check, the proof. */
const items: Item[] = [
  {
    kind: "photo",
    src: unsplash("1694286068611-d0c24cbc2cd5"),
    caption: "Sunday meal · Lagos Island",
  },
  {
    kind: "proof",
    icon: Repeat2,
    label: "Your gift",
    body: (
      <>
        <p className="font-display text-[44px] leading-none text-ink">₦25,000</p>
        <p className="text-[15px] leading-[21px] text-ink-soft">
          monthly to ECWA missionaries in Borno
        </p>
        <p className="mt-auto flex items-center gap-1.5 text-[13px] text-muted-ink">
          <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} /> Next on 1 November
        </p>
      </>
    ),
  },
  {
    kind: "photo",
    src: unsplash("1521493959102-bdd6677fdd81"),
    caption: "Afternoon lessons · Jos",
  },
  {
    kind: "proof",
    icon: BadgeCheck,
    label: "Verified organisation",
    body: (
      <>
        <p className="text-[19px] font-semibold leading-[24px] text-heading">
          Grace Harvest Orphanage
        </p>
        <ul className="mt-auto flex flex-col gap-2 text-[14px] text-ink-soft">
          {["CAC registration", "Bank account name match", "Site visit in Jos"].map((c) => (
            <li key={c} className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#00B67A]" strokeWidth={1.75} /> {c}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  { kind: "photo", src: unsplash("1536064479547-7ee40b74b807"), caption: "Medical mission · Mubi" },
  {
    kind: "proof",
    icon: ReceiptText,
    label: "Receipt posted",
    body: (
      <>
        <p className="text-[15px] text-ink-soft">Jos Timber Works</p>
        <p className="font-display text-[44px] leading-none text-ink">₦780,000</p>
        <p className="mt-auto rounded-lg bg-panel px-3 py-2 text-[13px] text-ink-soft">
          Matched to budget line &ldquo;20 bunk beds&rdquo;
        </p>
      </>
    ),
  },
  {
    kind: "photo",
    src: unsplash("1604072366376-63d46248927e"),
    caption: "Sunday service · Ibadan",
  },
  {
    kind: "proof",
    icon: Megaphone,
    label: "Update shared",
    body: (
      <>
        <img
          src={unsplash("1710093072218-0024b8391475", 500)}
          alt=""
          loading="lazy"
          className="aspect-[16/10] w-full rounded-lg object-cover"
        />
        <p className="text-[15px] leading-[21px] text-heading">
          First 10 beds delivered and assembled.
        </p>
        <p className="mt-auto text-[13px] text-muted-ink">Grace Harvest · 6 October</p>
      </>
    ),
  },
];

function Card({ item, hidden }: { item: Item; hidden: boolean }) {
  if (item.kind === "photo") {
    return (
      <figure className="relative h-full w-[clamp(220px,20vw,300px)] overflow-hidden rounded-[20px]">
        <img
          src={item.src}
          alt={hidden ? "" : item.caption}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <figcaption className="absolute bottom-3 left-3 rounded-full bg-paper px-3 py-1.5 font-gsf text-[12px] font-medium text-heading">
          {item.caption}
        </figcaption>
      </figure>
    );
  }
  const Icon = item.icon;
  return (
    <div className="flex h-full w-[clamp(240px,21vw,300px)] flex-col gap-4 rounded-[20px] bg-paper p-6 font-gsf">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FFE228]">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {item.label}
      </p>
      {item.body}
    </div>
  );
}

export function YellowPanel() {
  return (
    <section id="impact" className="scroll-mt-0 overflow-hidden bg-[#FFE228] py-20 md:py-28">
      <div className="mx-auto grid w-full max-w-[1446px] gap-8 px-6 sm:px-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end lg:gap-16 lg:px-[clamp(40px,6vw,141px)]">
        <div className="flex flex-col gap-6">
          <p className="font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-[#130E30]">
            The transparency &amp; giving platform
          </p>
          <h2 className="ink-lines font-display text-[clamp(28px,3.9vw,64px)] leading-[1.1] tracking-[-0.03em] text-[#130E30]">
            <span className="block">Your gift, your impact.</span>
            <span className="block">Verified by your org.</span>
            <span className="block">Shared with every giver.</span>
          </h2>
        </div>
        <div className="flex flex-col items-start gap-6 lg:pb-3">
          <p className="max-w-[460px] font-gsf text-lg leading-[1.55] tracking-[-0.02em] text-[#4A4660]">
            One giving history for every church, missionary and faith-based organisation you
            support, so you always know exactly where your money went.
          </p>
          <Link
            to="/signup"
            className="press inline-flex items-center justify-center rounded-full border-2 border-[#130E30] bg-[#130E30] px-[22px] py-3 font-gsf text-base font-medium leading-5 tracking-[-0.02em] text-[#EFF2E5] transition-opacity hover:opacity-90"
          >
            Start giving
          </Link>
        </div>
      </div>

      {/* Full-bleed loop; hover pauses it, reduced motion turns it into a swipe row. */}
      <div className="marquee mt-14 h-[300px] overflow-hidden md:mt-20 md:h-[380px]">
        <ul className="marquee-track flex h-full w-max gap-4 pr-4 md:gap-5 md:pr-5">
          {[...items, ...items].map((item, i) => (
            <li key={i} aria-hidden={i >= items.length} className="h-full shrink-0">
              <Card item={item} hidden={i >= items.length} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
