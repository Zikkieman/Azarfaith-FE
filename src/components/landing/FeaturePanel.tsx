import { Link } from "@tanstack/react-router";

const secondaryHeadings = [
  { label: "Discover", width: 788 },
  { label: "Build Trust Instantly", width: 788 },
  { label: "Track Donations", width: 788 },
  { label: "Easy payouts", width: 480.61 },
];

export function FeaturePanel() {
  return (
    <section className="flex w-full flex-col lg:flex-row lg:items-stretch">
      <div className="flex w-full flex-col gap-2 bg-[#F7F5F3] p-10 lg:h-[1073px] lg:w-[868px] lg:shrink-0">
        <div className="flex flex-col rounded-[20px] bg-[#F6F6F4]">
          <div className="py-2">
            <h2 className="font-gsf text-[clamp(30px,2.32vw,40px)] leading-[1.3] tracking-[-0.02em] text-[#141414]">
              Reach More Donors
            </h2>
          </div>

          <div className="flex w-full max-w-[788px] flex-col gap-[43.4px] py-4">
            <div className="flex flex-col gap-8">
              <p className="font-gsf text-[20px] leading-7 text-[rgba(20,20,20,0.75)]">
                Keep every campaign organized from start to finish with one dashboard for donors,
                updates, receipts, history, and impact context.
              </p>
              <div className="pb-10">
                <Link
                  to="/register-org"
                  className="inline-flex flex-col items-center rounded-xl bg-[#141414] px-12 py-3 transition-opacity hover:opacity-90"
                >
                  <span className="text-center font-gsf text-[20px] font-semibold leading-7 text-white">
                    Register Org
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {secondaryHeadings.map((heading) => (
          <div key={heading.label} className="contents">
            <div className="h-px w-full max-w-[788px] shrink-0 bg-[rgba(20,20,20,0.08)]" />
            <div className="py-2 opacity-30" style={{ maxWidth: heading.width }}>
              <h3 className="font-gsf text-[clamp(30px,2.32vw,40px)] leading-[1.3] tracking-[-0.02em] text-[#141414]">
                {heading.label}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden min-w-0 flex-1 bg-white lg:block" />
    </section>
  );
}
