import { Link } from "@tanstack/react-router";
import iconFaqChevron from "@/assets/landing/icon-faq-chevron.svg";

const questions = [
  "What is AzarFaith?",
  "Which organizations and causes does AzarFaith cover?",
  "Why choose AzarFaith over another giving platform?",
  "Does my giving carry over every year, or does it restart each time?",
  "How do you measure the impact of the giving I do?",
  "What are the steps to start giving on AzarFaith?",
];

export function Faq() {
  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-20 md:px-12">
      <div className="flex w-full max-w-[720px] flex-col gap-[22px]">
        <p className="font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-[#4A4660]">
          FAQ
        </p>

        <h2 className="font-display text-[clamp(30px,2.78vw,48px)] leading-[1.14] tracking-[-0.01em] text-[#130E30]">
          Frequently asked questions
        </h2>

        <div className="flex flex-col">
          {questions.map((question) => (
            <div key={question} className="flex flex-col border-t border-[#D9DDBC]">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-[17px] text-left"
              >
                <span className="font-gsf text-base leading-[22.4px] tracking-[-0.02em] text-[#130E30]">
                  {question}
                </span>
                <img src={iconFaqChevron} alt="" className="h-[18px] w-[18px] shrink-0" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Link
            to="/discover"
            className="font-gsf text-sm font-semibold text-[#130E30] underline-offset-4 hover:underline"
          >
            Talk to our team →
          </Link>
        </div>
      </div>
    </section>
  );
}
