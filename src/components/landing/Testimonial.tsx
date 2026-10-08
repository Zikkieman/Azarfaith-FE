import { BadgeCheck, Lock } from "lucide-react";
import { Seal } from "@/components/landing/Seal";

export function Testimonial() {
  return (
    <section className="flex w-full flex-col items-stretch bg-white lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full bg-[#FE5102] px-7 py-12 lg:h-[482px] lg:min-w-0 lg:flex-1 lg:px-0 lg:py-0">
        <div className="flex flex-col gap-7 lg:absolute lg:left-[228px] lg:top-[107.91px] lg:w-[573.38px]">
          <blockquote className="font-display text-[clamp(24px,1.97vw,34px)] leading-[1.26] tracking-[-0.01em] text-[#130E30]">
            “A big thank you to AzarFaith, who made giving simple and transparent. Thank you for
            helping us reach more supporters. We have grown in every area.”
          </blockquote>

          <div className="flex flex-wrap items-center gap-2.5 text-[#130E30]">
            <span className="hidden h-px w-[14px] bg-[#130E30] lg:block" />
            <span className="font-gsf text-base font-semibold leading-6 tracking-[-0.01em]">
              Adaeze Nwosu
            </span>
            <span className="font-gsf text-base leading-6 tracking-[-0.01em]">·</span>
            <span className="font-gsf text-base leading-6 tracking-[-0.01em]">
              Pastor, Living Seed Chapel
            </span>
          </div>
        </div>

        <div className="mt-8 hidden h-[322px] w-[575.39px] rounded-[20px] border border-[#130E30] lg:absolute lg:left-[857.38px] lg:top-[80px] lg:mt-0 lg:block" />
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-4 bg-white px-12 py-[42.92px] lg:h-[482px] lg:w-[257.23px] lg:shrink-0">
        <p className="text-center font-gsf text-sm leading-[19.6px] tracking-[-0.02em] text-[#4A4660]">
          Verified by:
        </p>
        <Seal
          width="161.23px"
          height="178px"
          className="rounded-2xl"
          icon={<BadgeCheck className="h-9 w-9 text-[#130E30]" strokeWidth={1.5} />}
          label="AzarFaith"
          caption="Verified organizations"
        />
        <Seal
          width="147px"
          height="147px"
          className="rounded-lg"
          icon={<Lock className="h-8 w-8 text-[#130E30]" strokeWidth={1.5} />}
          label="Secure"
          caption="payments"
        />
      </div>
    </section>
  );
}
