import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Lock, Percent, ReceiptText } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { reducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

type Card =
  | { kind: "quote"; tone: "orange" | "ink" | "paper"; quote: string; name: string; role: string }
  | { kind: "photo"; src: string; figure: string; label: string; name: string; role: string };

/* Sample voices for the prototype — swap for real, consented testimonials before launch. */
const cards: Card[] = [
  {
    kind: "quote",
    tone: "orange",
    quote:
      "AzarFaith made giving simple and transparent. We reached more supporters in a year than in the five before it.",
    name: "Adaeze Nwosu",
    role: "Pastor, Living Seed Chapel",
  },
  {
    kind: "photo",
    src: photo("1694286068611-d0c24cbc2cd5"),
    figure: "₦8.75M",
    label: "received for Sunday meals under the bridge",
    name: "Church Under The Bridge",
    role: "Lagos Island",
  },
  {
    kind: "quote",
    tone: "ink",
    quote:
      "I give to my home church from Houston every month, and for the first time I can see exactly what it pays for.",
    name: "Chidinma Okoro",
    role: "Monthly giver",
  },
  {
    kind: "photo",
    src: photo("1509099927777-1b8a87bc3b21"),
    figure: "20 beds",
    label: "funded by 89 givers, with every receipt posted",
    name: "Grace Harvest Orphanage",
    role: "Jos, Plateau State",
  },
  {
    kind: "quote",
    tone: "paper",
    quote:
      "Monthly support means we plan the next village visit instead of waiting to see what comes in.",
    name: "Kolade Akinwale",
    role: "Missionary, North-Central Nigeria",
  },
  {
    kind: "photo",
    src: photo("1604072424771-7300bc5de457"),
    figure: "847",
    label: "supporters behind missionaries in the North",
    name: "ECWA Mission Board",
    role: "Kaduna",
  },
];

const tones = {
  orange: "bg-[#FE5102] text-[#130E30]",
  ink: "bg-[#130E30] text-[#EFF2E5]",
  paper: "border border-line bg-panel-olive text-ink",
};

function QuoteCard({ c }: { c: Extract<Card, { kind: "quote" }> }) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col justify-between gap-8 rounded-[20px] p-7 md:p-9",
        tones[c.tone],
      )}
    >
      <span aria-hidden className="font-display text-[72px] leading-[0.6] opacity-60">
        &ldquo;
      </span>
      <blockquote className="font-display text-[clamp(22px,1.8vw,28px)] leading-[1.28] tracking-[-0.03em]">
        {c.quote}
      </blockquote>
      <figcaption className="flex flex-col gap-0.5 font-gsf">
        <span className="text-base font-semibold">{c.name}</span>
        <span className="text-sm opacity-75">{c.role}</span>
      </figcaption>
    </figure>
  );
}

function PhotoCard({ c }: { c: Extract<Card, { kind: "photo" }> }) {
  return (
    <figure className="relative flex h-full flex-col justify-end overflow-hidden rounded-[20px] bg-panel">
      <img
        src={c.src}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <figcaption className="relative m-3 flex flex-col gap-3 rounded-2xl bg-paper p-5">
        <span className="font-display text-[clamp(34px,3vw,46px)] font-bold leading-none text-ink">
          {c.figure}
        </span>
        <span className="font-gsf text-[15px] leading-[21px] text-ink-soft">{c.label}</span>
        <span className="flex items-center gap-1.5 border-t border-line-soft pt-3 font-gsf text-sm text-heading">
          <BadgeCheck className="h-4 w-4 shrink-0 text-[#00B67A]" strokeWidth={1.75} />
          <span className="font-semibold">{c.name}</span>
          <span className="text-muted-ink">· {c.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

const trust = [
  { icon: BadgeCheck, text: "Every organisation verified before it can receive gifts" },
  { icon: Lock, text: "Card and bank payments secured by Paystack" },
  { icon: ReceiptText, text: "Receipts and updates on every campaign" },
  { icon: Percent, text: "A flat 2.5% fee, shown before you pay" },
];

/** Testimonial slider (pattern from Modash): quote cards alternate with photo + result cards. */
export function Testimonial() {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setEdges({
        start: el.scrollLeft < 8,
        end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Jump to the exact neighbouring card so arrows never fight scroll-snap.
  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const stops = [...el.querySelectorAll("li")].map((li) => li.offsetLeft - pad);
    const here = stops.reduce(
      (best, x, i) =>
        Math.abs(x - el.scrollLeft) < Math.abs(stops[best] - el.scrollLeft) ? i : best,
      0,
    );
    const target = stops[Math.max(0, Math.min(stops.length - 1, here + dir))];
    el.scrollTo({ left: target, behavior: reducedMotion() ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby="voices" className="bg-paper py-20 md:py-28">
      <div className="mx-auto flex w-full max-w-[1446px] flex-col gap-10 px-6 sm:px-10 lg:px-[clamp(40px,6vw,141px)]">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-[720px] flex-col gap-4">
            <h2
              id="voices"
              className="font-display text-[clamp(32px,3.2vw,56px)] leading-[1.08] tracking-[-0.03em] text-ink"
            >
              In their own words
            </h2>
            <p className="font-gsf text-lg leading-[1.55] tracking-[-0.03em] text-ink-soft">
              Pastors, missionaries and givers on what changed when every gift could be followed.
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            {[
              { dir: -1 as const, icon: ArrowLeft, label: "Previous", off: edges.start },
              { dir: 1 as const, icon: ArrowRight, label: "Next", off: edges.end },
            ].map(({ dir, icon: Icon, label, off }) => (
              <button
                key={label}
                type="button"
                aria-label={`${label} story`}
                onClick={() => step(dir)}
                disabled={off}
                className="press grid h-12 w-12 place-items-center rounded-full border border-ink text-ink transition-colors hover:bg-ink hover:text-ink-contrast disabled:cursor-default disabled:border-line disabled:text-subtle disabled:hover:bg-transparent"
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <ul
        ref={track}
        aria-label="Stories from churches and givers"
        className="relative mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 pb-2 [scrollbar-width:none] sm:scroll-px-10 sm:px-10 lg:scroll-px-[clamp(40px,6vw,141px)] lg:px-[clamp(40px,6vw,141px)] xl:scroll-px-[max(clamp(40px,6vw,141px),calc((100vw_-_1446px)/2_+_clamp(40px,6vw,141px)))] xl:px-[max(clamp(40px,6vw,141px),calc((100vw_-_1446px)/2_+_clamp(40px,6vw,141px)))] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((c, i) => (
          <li
            key={c.name}
            style={{ "--i": i } as CSSProperties}
            className="h-[460px] w-[84vw] max-w-[420px] shrink-0 snap-start sm:w-[380px] md:h-[500px]"
          >
            {c.kind === "quote" ? <QuoteCard c={c} /> : <PhotoCard c={c} />}
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-12 w-full max-w-[1446px] px-6 sm:px-10 lg:px-[clamp(40px,6vw,141px)]">
        <ul className="grid gap-x-8 gap-y-4 border-y border-line py-6 sm:grid-cols-2 xl:grid-cols-4">
          {trust.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 font-gsf text-[15px] leading-[21px] text-heading"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-ink">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
