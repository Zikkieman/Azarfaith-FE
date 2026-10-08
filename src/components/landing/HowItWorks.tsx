import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/motion/Reveal";

const steps = [
  {
    title: "Choose a verified cause",
    body: "Browse churches, missions, orphanages and faith schools. Each one is checked before it can receive a single naira.",
  },
  {
    title: "Give once or on a schedule",
    body: "Pick an amount and give one time, weekly, monthly or quarterly by card or bank transfer. The 2.5% fee is shown before you pay.",
  },
  {
    title: "See what your gift did",
    body: "Your receipt arrives straight away. Updates, photos and spending receipts from the organization follow in your giving history.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-paper px-6 py-20 sm:px-10 md:py-28 lg:px-[clamp(40px,8.2vw,141px)]"
    >
      <div className="mx-auto flex w-full max-w-[1446px] flex-col gap-14">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-[640px] font-display text-[clamp(32px,3.2vw,56px)] leading-[1.08] tracking-[-0.01em] text-ink">
            How giving works
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/discover"
              className="press inline-flex items-center rounded-full border-2 border-ink bg-ink px-[22px] py-3 font-gsf text-base font-medium leading-5 tracking-[-0.02em] text-ink-contrast transition-opacity hover:opacity-90"
            >
              Browse causes
            </Link>
            <Link
              to="/$page"
              params={{ page: "verification" }}
              className="press inline-flex items-center rounded-full border border-ink px-[22px] py-3 font-gsf text-base leading-5 tracking-[-0.02em] text-ink transition-colors hover:bg-ink/5"
            >
              How we verify
            </Link>
          </div>
        </Reveal>

        <Reveal as="ol" className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          <span
            aria-hidden
            className="absolute left-0 right-0 top-[34px] hidden h-px bg-line md:block"
          />
          <span
            aria-hidden
            className="steps-line absolute left-0 right-0 top-[34px] hidden h-[2px] origin-left bg-[#FE5102] md:block"
          />
          {steps.map((step, i) => (
            <li
              key={step.title}
              data-stagger
              style={{ "--i": i } as CSSProperties}
              className="relative flex flex-col gap-4"
            >
              <span className="relative grid h-[68px] w-[68px] place-items-center rounded-full border border-line bg-paper font-display text-[30px] font-black text-ink">
                {i + 1}
              </span>
              <h3 className="font-gsf text-[clamp(22px,1.6vw,28px)] font-semibold leading-[1.2] text-heading">
                {step.title}
              </h3>
              <p className="max-w-[380px] font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">
                {step.body}
              </p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
