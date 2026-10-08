import { BadgeCheck, Lock } from "lucide-react";
import { Seal } from "@/components/landing/Seal";
import { Reveal } from "@/components/motion/Reveal";

const photo =
  "https://images.unsplash.com/photo-1604072424771-7300bc5de457?auto=format&fit=crop&w=1200&q=80";

export function Testimonial() {
  return (
    <section className="flex w-full flex-col items-stretch bg-paper lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full flex-col gap-10 bg-[#FE5102] px-6 py-12 sm:px-10 lg:min-h-[482px] lg:min-w-0 lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:gap-[clamp(32px,3.5vw,56px)] lg:py-20 lg:pl-[clamp(48px,13.2vw,228px)] lg:pr-[clamp(32px,4vw,64px)]">
        <Reveal className="flex max-w-[573px] flex-col gap-7 lg:min-w-0 lg:flex-1">
          <blockquote className="font-display text-[clamp(24px,1.97vw,34px)] leading-[1.26] tracking-[-0.01em] text-ink">
            “A big thank you to AzarFaith, who made giving simple and transparent. Thank you for
            helping us reach more supporters. We have grown in every area.”
          </blockquote>

          <div className="flex flex-wrap items-center gap-2.5 text-ink">
            <span className="hidden h-px w-[14px] bg-ink lg:block" />
            <span className="font-gsf text-base font-semibold leading-6 tracking-[-0.01em]">
              Adaeze Nwosu
            </span>
            <span className="font-gsf text-base leading-6 tracking-[-0.01em]">·</span>
            <span className="font-gsf text-base leading-6 tracking-[-0.01em]">
              Pastor, Living Seed Chapel
            </span>
          </div>
        </Reveal>

        <div className="hidden h-[322px] w-[clamp(300px,33vw,575px)] shrink-0 overflow-hidden rounded-[20px] border border-ink xl:block">
          <img src={photo} alt="" className="h-full w-full object-cover" />
        </div>
      </div>

      <div className="flex w-full flex-row flex-wrap items-center justify-center gap-4 bg-paper px-6 py-10 sm:px-12 lg:h-[482px] lg:w-[257.23px] lg:shrink-0 lg:flex-col lg:flex-nowrap">
        <p className="w-full text-center font-gsf text-sm leading-[19.6px] tracking-[-0.02em] text-ink-soft">
          Verified by:
        </p>
        <Seal
          width="161.23px"
          height="178px"
          className="rounded-2xl"
          icon={<BadgeCheck className="h-9 w-9 text-ink" strokeWidth={1.5} />}
          label="AzarFaith"
          caption="Verified organizations"
        />
        <Seal
          width="147px"
          height="147px"
          className="rounded-lg"
          icon={<Lock className="h-8 w-8 text-ink" strokeWidth={1.5} />}
          label="Secure"
          caption="payments"
        />
      </div>
    </section>
  );
}
