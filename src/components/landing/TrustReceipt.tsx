import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import logoMark from "@/assets/signup/logo-mark.svg";
import { Reveal } from "@/components/motion/Reveal";

/** Each line is a promise, linked to the page that backs it. */
const lines = [
  { label: "Organization verified before its first gift", value: "Yes", page: "verification" },
  { label: "Platform fee, shown before you pay", value: "2.5%", page: "platform-fee" },
  { label: "Card details stored by AzarFaith", value: "None", page: "payment-security" },
  { label: "Payout to the verified bank account", value: "1 working day", page: "payouts" },
  { label: "Receipt and update after spending", value: "Always", page: "campaign-updates" },
];

/** The site's trust promises, printed as a giving receipt. */
export function TrustReceipt() {
  return (
    <Reveal className="grid items-center gap-10 rounded-[28px] bg-panel px-6 py-12 sm:px-10 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16 lg:px-16">
      <div className="flex max-w-[460px] flex-col gap-4">
        <h3 className="font-display text-[clamp(28px,2.6vw,44px)] font-medium leading-[1.08] tracking-[-0.03em] text-ink">
          What every giver can count on
        </h3>
        <p className="font-gsf text-lg leading-[1.55] tracking-[-0.02em] text-ink-soft">
          The same promises come with every gift, big or small. Tap any line to see exactly how it
          works.
        </p>
      </div>

      <div className="receipt-slip relative mx-auto w-full max-w-[520px] rotate-[-1.2deg]">
        <div className="receipt-print relative bg-paper px-6 pb-10 pt-7 font-gsf sm:px-8">
          <div className="flex items-center justify-between gap-4 border-b border-dashed border-line-strong pb-4">
            <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <img src={logoMark} alt="" className="h-5 w-5" /> Giving receipt
            </span>
            <span className="text-[12px] tabular-nums text-muted-ink">No. 0001 · every gift</span>
          </div>

          <ul className="flex flex-col py-3">
            {lines.map((l, i) => (
              <li key={l.label} data-stagger style={{ "--i": i + 2 } as CSSProperties}>
                <Link
                  to="/$page"
                  params={{ page: l.page }}
                  className="group -mx-2 flex items-baseline gap-2 rounded-md px-2 py-2.5 text-[15px] transition-colors hover:bg-panel"
                >
                  <span className="text-heading group-hover:underline group-hover:underline-offset-2">
                    {l.label}
                  </span>
                  <span
                    aria-hidden
                    className="min-w-6 flex-1 translate-y-[-3px] border-b-2 border-dotted border-line-strong"
                  />
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{l.value}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-4">
            <span className="text-[17px] font-semibold text-ink">Every gift</span>
            <span className="text-[17px] font-semibold text-ink">Accounted for</span>
          </div>

          <span className="stamp absolute -bottom-1 right-6 rotate-[-12deg] rounded-md border-[3px] border-[#00B67A] bg-paper px-3 py-1 text-[13px] font-bold uppercase tracking-[0.12em] text-[#00B67A]">
            Verified
          </span>
        </div>
        {/* Torn paper edge */}
        <svg
          aria-hidden
          viewBox="0 0 100 4"
          preserveAspectRatio="none"
          className="receipt-print block h-3 w-full fill-paper"
        >
          <path d="M0 0H100V1L96 4L92 1L88 4L84 1L80 4L76 1L72 4L68 1L64 4L60 1L56 4L52 1L48 4L44 1L40 4L36 1L32 4L28 1L24 4L20 1L16 4L12 1L8 4L4 1L0 4Z" />
        </svg>
      </div>
    </Reveal>
  );
}
