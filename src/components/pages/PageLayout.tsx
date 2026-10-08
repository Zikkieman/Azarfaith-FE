import { Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/landing/SiteNav";
import { useScrollProgress } from "@/lib/motion";
import { Footer } from "@/components/landing/Footer";
import { Blocks } from "@/components/pages/Blocks";
import type { PageDoc } from "@/components/pages/types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ClosingCta({ page }: { page: PageDoc }) {
  const cta =
    page.cta ??
    ({
      heading: "Ready to give with confidence?",
      text: "Turn your generosity into lasting impact for the church, with full transparency at every step of the way.",
      primary: { label: "Start giving", to: "/signup" },
      secondary: { label: "Browse causes", to: "/discover" },
    } satisfies NonNullable<PageDoc["cta"]>);

  return (
    <section className="border-t border-line bg-paper px-6 py-20 md:px-12">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-7">
        <h2 className="text-center font-display text-[clamp(30px,3vw,48px)] leading-[1.1] tracking-[-0.01em] text-ink">
          {cta.heading}
        </h2>
        {cta.text ? (
          <p className="max-w-[640px] text-center font-gsf text-lg leading-[27.9px] tracking-[-0.02em] text-ink-soft">
            {cta.text}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={cta.primary.to}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-[22px] py-3 font-gsf text-base leading-5 tracking-[-0.02em] text-ink-contrast transition-opacity hover:opacity-90"
          >
            {cta.primary.label}
          </Link>
          {cta.secondary ? (
            <Link
              to={cta.secondary.to}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink px-[22px] py-3 font-gsf text-base leading-6 tracking-[-0.02em] text-ink transition-colors hover:bg-ink/5"
            >
              {cta.secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ReadingProgress() {
  const p = useScrollProgress();
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[#FE5102]"
      style={{ transform: `scaleX(${p})` }}
    />
  );
}

export function PageLayout({ page }: { page: PageDoc }) {
  const toc = page.blocks
    .filter((block) => block.type === "h2")
    .map((block) => ({ id: slugify(block.text), text: block.text }));
  const wide = page.template === "cards" || page.template === "directory";
  const showToc = !wide && toc.length >= 3;

  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-gsf text-heading">
      <ReadingProgress />
      <SiteNav />

      <main>
        <section className="border-b border-line bg-paper px-6 pb-14 pt-14 md:px-12 md:pt-20">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
            <p className="font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-ink-soft">
              {page.eyebrow}
            </p>
            <h1 className="max-w-[900px] font-display text-[clamp(32px,3.7vw,56px)] leading-[1.08] tracking-[-0.01em] text-ink">
              {page.title}
            </h1>
            <p className="max-w-[760px] font-gsf text-lg leading-[27.9px] tracking-[-0.02em] text-ink-soft">
              {page.lead}
            </p>
            {page.updated ? (
              <p className="font-gsf text-[13px] leading-[19.5px] text-muted-ink">{page.updated}</p>
            ) : null}
          </div>
        </section>

        <section className="px-6 py-16 md:px-12 md:py-20">
          <div
            className={`mx-auto grid w-full max-w-[1280px] gap-12 ${showToc ? "lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]" : ""}`}
          >
            {showToc ? (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <p className="pb-3 font-gsf text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.1em] text-ink-soft">
                  On this page
                </p>
                <nav className="flex flex-col border-t border-line">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="border-b border-line py-3 font-gsf text-sm leading-[21px] text-ink transition-opacity hover:opacity-70"
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </aside>
            ) : null}

            <article
              className={
                wide ? "min-w-0 w-full" : showToc ? "min-w-0 max-w-[820px]" : "w-full max-w-[820px]"
              }
            >
              <Blocks blocks={page.blocks} />
            </article>
          </div>
        </section>

        <ClosingCta page={page} />
      </main>

      <Footer />
    </div>
  );
}
