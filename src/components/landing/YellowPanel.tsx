import { Link } from "@tanstack/react-router";

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&h=1280&q=80`;

const photos = [
  { src: unsplash("1604072366376-63d46248927e"), alt: "A congregation standing in worship" },
  {
    src: unsplash("1694286068611-d0c24cbc2cd5"),
    alt: "Church members sharing a meal after service",
  },
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
          <p className="font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-[#130E30]">
            The transparency &amp; giving platform
          </p>

          <div className="flex flex-col">
            {headingLines.map((line) => (
              <div key={line} className="py-2">
                <h2 className="font-display text-[clamp(30px,2.78vw,48px)] leading-[1.14] tracking-[-0.01em] text-[#130E30]">
                  {line}
                </h2>
              </div>
            ))}
          </div>

          <p className="max-w-[520px] font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-[#4A4660]">
            One giving history for every church, missionary, and faith-based organization you
            support. So you always know exactly where your money went.
          </p>

          <div>
            <Link
              to="/discover"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#130E30] px-[22px] py-3 font-gsf text-base leading-5 tracking-[-0.02em] text-[#EFF2E5] transition-opacity hover:opacity-90"
            >
              Start giving
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden items-center overflow-hidden lg:flex">
        <div className="flex shrink-0 -translate-x-[clamp(24px,2.6vw,45px)] gap-[clamp(16px,1.6vw,28px)]">
          {photos.map((photo) => (
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              className="aspect-[500/640] w-[clamp(300px,28.9vw,500px)] rounded-[20px] object-cover"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
