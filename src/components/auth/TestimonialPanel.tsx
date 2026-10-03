import logoMark from "@/assets/signup/logo-mark.svg";

export function TestimonialPanel() {
  return (
    <div className="hidden h-[482px] w-[591px] flex-col items-start gap-[29px] overflow-clip rounded-[22px] px-[50px] py-[75px] lg:flex">
      <p className="min-w-full text-[40px] font-medium leading-[51px] text-[#232323]">
        “Create your free account and support churches, missionaries, and faith-based organizations
        across Nigeria.”
      </p>
      <div className="flex items-center gap-[12px]">
        <div className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#fe5102]/10">
          <img src={logoMark} alt="" className="h-6 w-6" />
        </div>
        <div className="text-[16px] leading-[24px]">
          <p className="font-semibold text-[#344054]">AzarFaith</p>
          <p className="text-[#475467]">Give to those doing God&rsquo;s work.</p>
        </div>
      </div>
    </div>
  );
}
