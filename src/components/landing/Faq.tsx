import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import iconFaqChevron from "@/assets/landing/icon-faq-chevron.svg";
import { Reveal } from "@/components/motion/Reveal";

const questions = [
  {
    q: "What is AzarFaith?",
    a: "AzarFaith is a giving platform for faith-based work in Nigeria. Churches, missionaries, orphanages and faith schools raise support here, and givers can see exactly where every naira goes.",
  },
  {
    q: "Which organizations and causes does AzarFaith cover?",
    a: "Local churches and church plants, mission and outreach teams, orphanages and children's homes, faith-based schools, and relief or medical missions run by Christian ministries across Nigeria.",
  },
  {
    q: "Why choose AzarFaith over another giving platform?",
    a: "Every organization is verified before it can receive gifts, fees are a flat 2.5% shown before you pay, and organizations post updates and receipts so you can follow your giving.",
  },
  {
    q: "Does my giving carry over every year, or does it restart each time?",
    a: "Recurring gifts continue until you stop them. You can pause or cancel any standing gift from My giving at any time, and your full giving history stays in your account.",
  },
  {
    q: "How do you measure the impact of the giving I do?",
    a: "Organizations share updates, photos and receipts on each campaign. Your giving history shows what you gave, to whom, and what they reported back.",
  },
  {
    q: "What are the steps to start giving on AzarFaith?",
    a: "Find a cause on Discover, choose an amount and whether to give once or on a schedule, then pay by card or bank transfer. You'll get a receipt straight away.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="flex w-full flex-col items-center bg-paper px-6 py-20 md:px-12">
      <Reveal className="flex w-full max-w-[720px] flex-col gap-[22px]">
        <p className="font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-ink-soft">
          FAQ
        </p>

        <h2 className="font-display text-[clamp(30px,2.78vw,48px)] leading-[1.14] tracking-[-0.01em] text-ink">
          Frequently asked questions
        </h2>

        <div className="flex flex-col border-b border-line">
          {questions.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div key={q} className="flex flex-col border-t border-line">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 py-[17px] text-left"
                >
                  <span className="font-gsf text-base leading-[22.4px] tracking-[-0.02em] text-ink">
                    {q}
                  </span>
                  <img
                    src={iconFaqChevron}
                    alt=""
                    className={`h-[18px] w-[18px] shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div id={`faq-${i}`} className="expand" data-open={isOpen ? "" : undefined}>
                  <div>
                    <p className="max-w-[640px] pb-5 font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Link
          to="/$page"
          params={{ page: "support" }}
          className="inline-flex items-center gap-2 self-start font-gsf text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          Still have a question? Talk to our team{" "}
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </Reveal>
    </section>
  );
}
