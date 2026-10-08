import { Link } from "@tanstack/react-router";

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&h=1280&q=80`;

const photos = [
  { src: unsplash("1604072366376-63d46248927e"), alt: "A congregation standing in worship" },
  {
    src: unsplash("1694286068611-d0c24cbc2cd5"),
    alt: "Church members sharing a meal after service",
  },
  {
    src: unsplash("1521493959102-bdd6677fdd81"),
    alt: "Children looking out of a classroom window",
  },
  {
    src: unsplash("1536064479547-7ee40b74b807"),
    alt: "A doctor seeing a young patient at a medical mission",
  },
  { src: unsplash("1553775927-a071d5a6a39a"), alt: "Women carrying water home along a dirt road" },
  { src: unsplash("1523396140703-e5bdad4e5dea"), alt: "A schoolgirl holding her book" },
];

const headingLines = [
  "Your gift, your impact.",
  "Verified by your org.",
  "Shared with every giver.",
];

export function YellowPanel() {
  return (
    <section className="grid w-full grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,868fr)_minmax(0,860fr)]">
      <div className="flex flex-col justify-center bg-[#FFE228] px-6 py-14 sm:px-10 sm:py-16 lg:min-h-[clamp(680px,61.3vw,1059px)] lg:py-20 lg:pl-[clamp(48px,5.6vw,96px)] lg:pr-8">
        <div className="flex flex-col gap-[27.9px]">
          <p className="font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-ink">
            The transparency &amp; giving platform
          </p>

          <div className="flex flex-col">
            {headingLines.map((line) => (
              <div key={line} className="py-2">
                <h2 className="font-display text-[clamp(30px,2.78vw,48px)] leading-[1.14] tracking-[-0.01em] text-ink">
                  {line}
                </h2>
              </div>
            ))}
          </div>

          <p className="max-w-[520px] font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">
            One giving history for every church, missionary, and faith-based organization you
            support. So you always know exactly where your money went.
          </p>

          <div>
            <Link
              to="/discover"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-[22px] py-3 font-gsf text-base leading-5 tracking-[-0.02em] text-ink-contrast transition-opacity hover:opacity-90"
            >
              Start giving
            </Link>
          </div>
        </div>
      </div>

      {/* Photos glide right-to-left on a loop; hover pauses, reduced motion gets a swipe row. */}
      <div className="marquee flex h-[340px] items-center overflow-hidden bg-paper sm:h-[440px] lg:h-auto">
        <ul className="marquee-track flex w-max gap-[clamp(16px,1.6vw,28px)] pr-[clamp(16px,1.6vw,28px)]">
          {[...photos, ...photos].map((photo, i) => (
            <li key={i} aria-hidden={i >= photos.length} className="shrink-0">
              <img
                src={photo.src}
                alt={i >= photos.length ? "" : photo.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[500/640] w-[clamp(220px,28.9vw,500px)] rounded-[20px] object-cover"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
