import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check, MessageCircle } from "lucide-react";
import { SiteNav } from "@/components/landing/SiteNav";
import { Footer } from "@/components/landing/Footer";
import { CampaignCard } from "@/components/CampaignCard";
import { Photo } from "@/components/app/Photo";
import { Reveal } from "@/components/motion/Reveal";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/lib/motion";

const GOAL = 1_200_000;
const CAMPAIGN_ID = "gfc5";
const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Raised at the start and end of each week, so the rail fills as the story is read. */
const weeks = [
  { n: 1, title: "Twenty children, no beds of their own", from: 0, to: 0 },
  { n: 2, title: "The appeal goes live", from: 0, to: 310_000 },
  { n: 3, title: "The beds arrive", from: 310_000, to: 780_000 },
  { n: 4, title: "The first night", from: 780_000, to: 780_000 },
];

/* ─── Typography helpers ─────────────────────────────────────────────── */

function P({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <p
      className={cn(
        "font-gsf text-[clamp(17px,1.25vw,19px)] leading-[1.75] tracking-[-0.01em] text-heading",
        first &&
          "first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-display first-letter:text-[68px] first-letter:font-bold first-letter:leading-[0.8] first-letter:text-ink",
      )}
    >
      {children}
    </p>
  );
}

function Quote({ children, by }: { children: ReactNode; by: string }) {
  return (
    <Reveal as="figure" className="my-6 border-l-[3px] border-[#FE5102] pl-6 md:-ml-8 md:pl-8">
      <blockquote className="font-display text-[clamp(24px,2.3vw,34px)] leading-[1.25] tracking-[-0.03em] text-ink">
        {children}
      </blockquote>
      <figcaption className="pt-3 font-gsf text-sm text-muted-ink">{by}</figcaption>
    </Reveal>
  );
}

function Figure({ src, caption, wide }: { src: string; caption: string; wide?: boolean }) {
  return (
    <figure
      className={cn(
        "my-10 flex flex-col gap-3",
        wide ? "-mx-6 sm:mx-0 lg:-mx-[120px] xl:mx-0" : "",
      )}
    >
      <Photo
        src={src}
        className={cn("aspect-[3/2] w-full", wide ? "sm:rounded-2xl" : "rounded-2xl")}
      />
      <figcaption className="px-6 font-gsf text-[13px] leading-[19px] text-muted-ink sm:px-0">
        {caption}
      </figcaption>
    </figure>
  );
}

function Chapter({
  index,
  children,
  refCb,
}: {
  index: number;
  children: ReactNode;
  refCb: (el: HTMLElement | null) => void;
}) {
  const w = weeks[index];
  return (
    <section ref={refCb} data-week={index} className="scroll-mt-24 pt-20 md:pt-28">
      <Reveal className="mb-8 flex flex-col gap-3">
        <span className="font-gsf text-sm font-semibold text-[#FE5102]">Week {w.n}</span>
        <h2 className="font-display text-[clamp(30px,3.4vw,52px)] leading-[1.08] tracking-[-0.03em] text-ink">
          {w.title}
        </h2>
      </Reveal>
      <div className="flex flex-col gap-6">{children}</div>
      <Link
        to="/donate/$id"
        params={{ id: CAMPAIGN_ID }}
        search={{ freq: "" }}
        className="mt-8 inline-flex items-center gap-2 font-gsf text-sm font-semibold text-ink underline-offset-4 hover:underline"
      >
        Give to Grace Harvest <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </Link>
    </section>
  );
}

/* ─── The raise rail ──────────────────────────────────────────────────── */

function useRaised(chapters: React.MutableRefObject<(HTMLElement | null)[]>) {
  const [state, setState] = useState({ week: -1, raised: 0, ended: false });
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * 0.5;
      let week = -1;
      let raised = 0;
      chapters.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= line) {
          week = i;
          const f = Math.min(1, Math.max(0, (line - r.top) / r.height));
          raised = weeks[i].from + (weeks[i].to - weeks[i].from) * f;
        }
      });
      // Once the last chapter has scrolled past, the rail has nothing left to track.
      const last = chapters.current[weeks.length - 1];
      const ended = !!last && last.getBoundingClientRect().bottom < window.innerHeight * 0.6;
      setState({ week, raised: Math.round(raised / 1000) * 1000, ended });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [chapters]);
  return state;
}

function Rail({ week, raised, ended }: { week: number; raised: number; ended: boolean }) {
  const pct = Math.min(100, (raised / GOAL) * 100);
  // Sit under the site nav while it is showing (it hides on scroll down).
  const navHidden = useScrollDirection();
  const visible = week >= 0 && !ended;
  return (
    <>
      {/* Desktop: a vertical rail beside the text. */}
      <aside
        aria-label="Amount raised so far in the story"
        className={cn(
          "fixed left-[max(24px,calc(50%-600px))] top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 transition-opacity duration-500 xl:flex",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex gap-4">
          <div className="relative h-[260px] w-[3px] rounded-full bg-line-soft">
            <div
              className="absolute inset-x-0 top-0 rounded-full bg-[#FE5102] transition-[height] duration-300 ease-out"
              style={{ height: `${pct}%` }}
            />
          </div>
          <ol className="flex h-[260px] flex-col justify-between">
            {weeks.map((w, i) => (
              <li
                key={w.n}
                className={cn(
                  "font-gsf text-[12px] transition-colors",
                  i === week
                    ? "font-semibold text-ink"
                    : i < week
                      ? "text-ink-soft"
                      : "text-subtle",
                )}
              >
                Week {w.n}
              </li>
            ))}
          </ol>
        </div>
        <p className="font-gsf text-[12px] leading-[17px] text-muted-ink">
          <span className="block font-display text-[19px] font-bold leading-none text-ink tabular-nums">
            {formatMoney(raised)}
          </span>
          raised of {formatMoney(GOAL)}
        </p>
      </aside>

      {/* Phones and tablets: a thin bar pinned to the top. */}
      <div
        className={cn(
          "fixed inset-x-0 z-40 bg-paper/95 transition-[opacity,top] duration-300 xl:hidden",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{ top: navHidden ? 0 : 60 }}
      >
        <div className="h-[3px] bg-line-soft">
          <div
            className="h-full bg-[#FE5102] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="px-6 py-1.5 font-gsf text-[12px] text-ink-soft">
          Week {Math.max(1, week + 1)} ·{" "}
          <span className="font-semibold text-ink tabular-nums">{formatMoney(raised)}</span> raised
          of {formatMoney(GOAL)}
        </p>
      </div>
    </>
  );
}

/* ─── Inline artefacts ───────────────────────────────────────────────── */

function Checks() {
  return (
    <Reveal className="my-4 rounded-2xl border border-line bg-panel-olive p-5">
      <p className="flex items-center gap-2 pb-3 font-gsf text-sm font-semibold text-ink">
        <BadgeCheck className="h-4 w-4 text-[#00B67A]" strokeWidth={2} /> Before the appeal went
        live, AzarFaith checked
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {[
          "CAC registration",
          "Bank account name match",
          "A call with the leadership",
          "A visit to the home in Jos",
          "Two references from local churches",
          "A safeguarding policy",
        ].map((c, i) => (
          <li
            key={c}
            data-stagger
            style={{ "--i": i } as React.CSSProperties}
            className="flex items-center gap-2 font-gsf text-[14px] text-heading"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#00B67A] text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {c}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function Receipt() {
  return (
    <Reveal className="relative my-6 rotate-[-0.6deg] rounded-sm border border-line bg-paper px-6 py-6 font-gsf shadow-[0_1px_0_var(--af-line)] sm:mx-6">
      <div className="flex items-start justify-between gap-4 border-b border-dashed border-line pb-4">
        <div>
          <p className="text-[15px] font-semibold text-ink">Jos Timber Works</p>
          <p className="text-[12px] text-muted-ink">Invoice 0412 · Rayfield Road, Jos</p>
        </div>
        <p className="text-right text-[12px] text-muted-ink">
          Paid
          <br />2 October 2026
        </p>
      </div>
      <div className="flex justify-between py-4 text-[14px] text-heading">
        <span>20 double bunk beds, local hardwood</span>
        <span className="tabular-nums">{formatMoney(780_000)}</span>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-[14px] font-semibold text-ink">
        <span>Total</span>
        <span className="tabular-nums">{formatMoney(780_000)}</span>
      </div>
      <p className="pr-24 pt-4 text-[12px] text-muted-ink">
        Uploaded by Grace Harvest · matched to budget line &ldquo;20 bunk beds&rdquo;
      </p>
      <span className="stamp absolute bottom-4 right-4 rotate-[-12deg] rounded-md border-[3px] border-[#00B67A] px-3 py-1 font-gsf text-[13px] font-bold uppercase tracking-[0.12em] text-[#00B67A] sm:right-6">
        Verified
      </span>
    </Reveal>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export function JosEssay() {
  const chapters = useRef<(HTMLElement | null)[]>([]);
  const { week, raised, ended } = useRaised(chapters);
  const campaign = useApp((s) => s.campaigns.find((c) => c.id === CAMPAIGN_ID));
  const shareText = encodeURIComponent(
    "One month in Jos: how 47 children got their own beds, followed week by week on AzarFaith",
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-gsf text-heading">
      <SiteNav />
      <Rail week={week} raised={raised} ended={ended} />

      <main>
        <header className="px-6 pb-10 pt-14 sm:px-10 md:pt-24">
          <div className="mx-auto flex max-w-[900px] flex-col items-center gap-6 text-center">
            <p className="font-gsf text-sm font-semibold text-[#FE5102]">
              A month with Grace Harvest Orphanage · Jos, Plateau State
            </p>
            <h1 className="font-display text-[clamp(48px,8vw,128px)] leading-[0.92] tracking-[-0.03em] text-ink">
              One month in Jos
            </h1>
            <p className="max-w-[680px] font-gsf text-[clamp(18px,1.5vw,22px)] leading-[1.5] text-ink-soft">
              Forty-seven children. Twenty-seven beds. How a small home on the edge of Jos raised
              the money for bunk beds, and showed every naira along the way.
            </p>
            <p className="font-gsf text-[13px] text-muted-ink">The AzarFaith team · 6 min read</p>
          </div>
        </header>

        <div className="mx-auto max-w-[1100px] px-0 sm:px-10">
          <Photo
            src={u("1521493959102-bdd6677fdd81")}
            loading="eager"
            className="aspect-[16/9] w-full sm:rounded-3xl"
          />
          <p className="px-6 pt-3 font-gsf text-[13px] text-muted-ink sm:px-0">
            Afternoon lessons at the home. Grace Harvest cares for 47 children, many displaced by
            conflict elsewhere in Plateau State.
          </p>
        </div>

        <article className="mx-auto max-w-[680px] px-6 pb-24">
          <Chapter
            index={0}
            refCb={(el) => {
              chapters.current[0] = el;
            }}
          >
            <P first>
              The home sits at the end of a laterite road on the southern edge of Jos. In September
              it took in fourteen more children, most of them from villages around Mangu. That
              brought the household to forty-seven, sharing twenty-seven beds.
            </P>
            <P>
              The arithmetic is simple and it is not kind. Twenty children were sharing, two and
              sometimes three to a mattress, or sleeping on mats in the corridor when the rains made
              the floor of the old store room too damp.
            </P>
            <Quote by="Mama Ruth, house mother at Grace Harvest">
              &ldquo;You don&rsquo;t sleep well three to a mattress, and you don&rsquo;t learn well
              the next morning.&rdquo;
            </Quote>
            <P>
              The home had raised money before, mostly by passing a phone number around church
              WhatsApp groups. Some of it arrived. None of the givers ever saw what happened next.
              This time they wanted to do it differently.
            </P>
            <Checks />
          </Chapter>

          <Chapter
            index={1}
            refCb={(el) => {
              chapters.current[1] = el;
            }}
          >
            <P>
              The appeal went live on a Monday with a plain budget: twenty bunk beds, forty
              mattresses, delivery and assembly. ₦1.2 million in total, each line costed against a
              quote from a carpenter in town.
            </P>
            <P>
              The first gifts came from a church in Surulere that had supported the home for years.
              By Wednesday the link had travelled further, to a fellowship in Abuja and to two
              families in Houston who grew up in Jos. Most gifts were small. A few were monthly.
            </P>
            {campaign ? (
              <Reveal className="my-6 sm:mx-10">
                <CampaignCard campaign={campaign} />
              </Reveal>
            ) : null}
            <P>
              By Sunday the appeal had ₦310,000 from forty-one people, and the carpenter had been
              asked to start.
            </P>
          </Chapter>

          <Chapter
            index={2}
            refCb={(el) => {
              chapters.current[2] = el;
            }}
          >
            <P>
              Musa at Jos Timber Works builds bunks the old way, in hardwood, with the joints pegged
              rather than screwed. He delivered ten on the first Friday and the remaining ten four
              days later, assembling them himself in the boys&rsquo; and girls&rsquo; rooms.
            </P>
            <P>
              The day the invoice was paid, the home uploaded it. AzarFaith matched it to the budget
              line it belonged to and every giver could see it in their giving history, next to
              their own gift.
            </P>
            <Receipt />
            <Figure
              wide
              src={u("1509099927777-1b8a87bc3b21")}
              caption="The new rooms on delivery day. Mattresses were still on order."
            />
          </Chapter>

          <Chapter
            index={3}
            refCb={(el) => {
              chapters.current[3] = el;
            }}
          >
            <P>
              The beds went into use that night, on the old mattresses for now. Mama Ruth stayed up
              later than usual to see how the younger ones would settle.
            </P>
            <Quote by="Mama Ruth">
              &ldquo;The first night was quiet. That&rsquo;s how I knew.&rdquo;
            </Quote>
            <P>
              The home posted an update the next morning with photos of every room. Forty-one people
              who had given that month opened it. Several wrote back. One of the families in Houston
              asked if they could pay for the delivery.
            </P>
            <Figure
              src={u("1710093072218-0024b8391475")}
              caption="Morning assembly, the day after the beds went in."
            />
            <P>
              What is left is the mattresses: forty of them, ₦360,000, plus delivery. The appeal is
              still open.
            </P>
          </Chapter>
        </article>

        <section className="bg-[#FFE228] px-6 py-20 md:py-28">
          <Reveal className="mx-auto flex max-w-[760px] flex-col items-center gap-6 text-center">
            <h2 className="font-display text-[clamp(32px,4vw,64px)] leading-[1.04] tracking-[-0.03em] text-[#130E30]">
              Every organization on AzarFaith has a story like this.
            </h2>
            <p className="max-w-[560px] font-gsf text-lg leading-[1.5] text-[#4A4660]">
              Finish this one, or find the next one near you.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/donate/$id"
                params={{ id: CAMPAIGN_ID }}
                search={{ freq: "" }}
                className="press inline-flex items-center rounded-full border-2 border-[#130E30] bg-[#130E30] px-6 py-3 font-gsf text-base font-medium text-[#EFF2E5] hover:opacity-90"
              >
                Give to Grace Harvest
              </Link>
              <Link
                to="/discover"
                className="press inline-flex items-center rounded-full border border-[#130E30] px-6 py-3 font-gsf text-base text-[#130E30] hover:bg-[#130E30]/5"
              >
                Find others like them
              </Link>
              <a
                href={`https://wa.me/?text=${shareText}%20${encodeURIComponent("https://azarfaith.vercel.app/jos")}`}
                target="_blank"
                rel="noreferrer"
                className="press inline-flex items-center gap-2 rounded-full border border-[#130E30] px-6 py-3 font-gsf text-base text-[#130E30] hover:bg-[#130E30]/5"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} /> Share on WhatsApp
              </a>
            </div>
            <p className="pt-2 font-gsf text-[12px] text-[#4A4660]">
              An illustrative story built from sample data for this prototype.
            </p>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
