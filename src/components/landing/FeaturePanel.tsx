import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";

const features = [
  {
    title: "Reach More Donors",
    body: "Keep every campaign organized from start to finish with one dashboard for donors, updates, receipts, history, and impact context.",
    cta: { label: "Register Org", to: "/register-org" },
  },
  {
    title: "Discover",
    body: "Givers find verified churches, missionaries, orphanages and schools by cause, place or denomination.",
    cta: { label: "Browse causes", to: "/discover" },
  },
  {
    title: "Build Trust Instantly",
    body: "Every organization is checked before it can receive gifts, and carries a verified badge givers can see.",
    cta: { label: "How verification works", to: "/verification" },
  },
  {
    title: "Track Donations",
    body: "Every gift, receipt and update sits in one giving history, so givers always know where their money went.",
    cta: { label: "See my giving", to: "/my-giving" },
  },
  {
    title: "Easy payouts",
    body: "Gifts land in your verified account on a clear schedule, with a 2.5% platform fee and nothing hidden.",
    cta: { label: "About payouts", to: "/payouts" },
  },
];

export function FeaturePanel() {
  const [open, setOpen] = useState(0);
  const campaign = useApp((s) => s.campaigns.find((c) => c.goal) ?? s.campaigns[0]);

  return (
    <section className="grid w-full grid-cols-1 lg:grid-cols-[minmax(0,868fr)_minmax(0,860fr)]">
      <div className="flex flex-col bg-[#F7F5F3] px-6 py-12 sm:px-10 lg:min-h-[clamp(720px,62vw,1073px)] lg:justify-center lg:px-[clamp(40px,4vw,72px)] lg:py-[clamp(64px,6vw,120px)]">
        {features.map((feature, i) => {
          const active = open === i;
          return (
            <div
              key={feature.title}
              className="max-w-[788px] border-t border-[rgba(20,20,20,0.08)] first:border-t-0"
            >
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-expanded={active}
                className={`w-full py-3 text-left font-gsf text-[clamp(26px,2.32vw,40px)] leading-[1.3] tracking-[-0.02em] text-[#141414] transition-opacity ${
                  active ? "opacity-100" : "opacity-30 hover:opacity-60"
                }`}
              >
                {feature.title}
              </button>
              {active ? (
                <div className="flex flex-col gap-8 pb-10 pt-2">
                  <p className="max-w-[640px] font-gsf text-[clamp(17px,1.16vw,20px)] leading-7 text-[rgba(20,20,20,0.75)]">
                    {feature.body}
                  </p>
                  <div>
                    <Link
                      to={feature.cta.to}
                      className="inline-flex items-center rounded-xl bg-[#141414] px-8 py-3 font-gsf text-[clamp(17px,1.16vw,20px)] font-semibold leading-7 text-white transition-opacity hover:opacity-90 sm:px-12"
                    >
                      {feature.cta.label}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="hidden items-center justify-center bg-white px-[clamp(32px,5vw,96px)] py-16 lg:flex">
        {campaign ? (
          <div className="w-full max-w-[440px]">
            <CampaignCard campaign={campaign} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
