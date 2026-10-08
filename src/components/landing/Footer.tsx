import { Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AuthLogo } from "@/components/auth/AuthLogo";
import iconLinkedin from "@/assets/landing/icon-linkedin.svg";
import iconYoutube from "@/assets/landing/icon-youtube.svg";
import iconFooterArrow from "@/assets/landing/icon-footer-arrow.svg";
import { Seal } from "@/components/landing/Seal";

const columns: {
  heading: string;
  links: { label: string; to: string }[];
  more?: { label: string; to: string };
}[] = [
  {
    heading: "Platform",
    links: [
      { label: "Log in", to: "/login" },
      { label: "Create an account", to: "/signup" },
      { label: "Organizations", to: "/organizations" },
      { label: "Campaign updates", to: "/campaign-updates" },
      { label: "Payouts", to: "/payouts" },
    ],
  },
  {
    heading: "Ways to give",
    links: [
      { label: "One-time", to: "/give-once" },
      { label: "Monthly support", to: "/monthly-support" },
      { label: "Emergency appeals", to: "/emergency-appeals" },
      { label: "Recurring", to: "/recurring" },
      { label: "Team giving", to: "/team-giving" },
      { label: "Sponsorship", to: "/sponsorship" },
      { label: "Matching gifts", to: "/matching-gifts" },
    ],
  },
  {
    heading: "For organizations",
    links: [
      { label: "Register your org", to: "/signup" },
      { label: "Verification", to: "/verification" },
      { label: "Payouts", to: "/payouts" },
      { label: "Update posts", to: "/update-posts" },
      { label: "Fees & pricing", to: "/fees-pricing" },
      { label: "Support", to: "/support" },
      { label: "Guidelines", to: "/guidelines" },
      { label: "Reports", to: "/reports" },
    ],
  },
  {
    heading: "Trust & safety",
    links: [
      { label: "Verification", to: "/verification" },
      { label: "Community reports", to: "/community-reports" },
      { label: "Refunds", to: "/refunds" },
      { label: "Payment security", to: "/payment-security" },
      { label: "Platform fee", to: "/platform-fee" },
      { label: "Data protection", to: "/data-protection" },
      { label: "Moderation", to: "/moderation" },
    ],
    more: { label: "All donor stories", to: "/donor-stories" },
  },
  {
    heading: "Company & resources",
    links: [
      { label: "About", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
      { label: "Help centre", to: "/help-center" },
      { label: "Guides", to: "/guides" },
      { label: "Events", to: "/events" },
      { label: "Manifesto", to: "/manifesto" },
    ],
  },
];

const legalLinks = [
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
  { label: "Legal notices", to: "/legal-notices" },
  { label: "Cookies", to: "/cookies" },
];

const trustBadges = [
  { label: "Verified organizations", dot: false },
  { label: "Secure payments", dot: true },
  { label: "2.5% platform fee", dot: true },
  { label: "Community reporting", dot: true },
  { label: "Registered in Nigeria", dot: true },
];

export function Footer() {
  return (
    <footer className="w-full bg-paper px-6 pb-6 pt-[42.92px] md:px-12">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7">
        <div className="flex w-full flex-col items-stretch gap-4 rounded-[28px] bg-peach p-4 pl-5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-8 sm:self-center sm:rounded-full sm:py-3 sm:pl-8 sm:pr-5">
          <p className="font-gsf text-base font-semibold leading-5 tracking-[-0.02em] text-ink">
            Practical giving updates—campaigns, stories, and receipts, in your inbox
          </p>
          <form
            className="flex h-14 w-full min-w-0 items-center rounded-full border-b border-line-strong bg-paper p-1 sm:w-[396.24px] sm:shrink-0"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="sr-only" htmlFor="footer-email">
              Email
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="name@church.org"
              className="min-w-0 flex-1 bg-transparent px-4 font-gsf text-base tracking-[-0.02em] text-ink outline-none placeholder:text-ink-soft"
            />
            <button
              type="submit"
              className="h-full w-[104px] shrink-0 cursor-pointer rounded-full border-2 border-ink bg-ink font-gsf text-sm font-medium text-ink-contrast transition-opacity hover:opacity-90 sm:w-[116.24px]"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-5 border-t border-line pt-6 sm:grid-cols-3 lg:grid-cols-5">
          {columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-1.5 self-start">
              <div className="pb-0.5">
                <h3 className="font-gsf text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.1em] text-ink-soft">
                  {column.heading}
                </h3>
              </div>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="font-gsf text-sm leading-[21px] text-ink transition-opacity hover:opacity-70"
                >
                  {link.label}
                </Link>
              ))}
              {column.more ? (
                <Link
                  to={column.more.to}
                  className="flex items-center gap-1.5 pt-1 font-gsf text-sm font-semibold leading-[21px] text-ink transition-opacity hover:opacity-70"
                >
                  {column.more.label}
                  <img src={iconFooterArrow} alt="" className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-7 border-t border-line pt-6 lg:flex-row lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <div className="flex flex-col gap-3">
              <div className="flex h-9 items-center">
                <AuthLogo />
              </div>
              <p className="font-display text-[22px] leading-[26.4px] text-ink">
                Give to churches and faith-based work across Nigeria
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {trustBadges.map((badge) => (
                <span key={badge.label} className="flex items-center gap-2">
                  {badge.dot ? (
                    <span className="h-1 w-1 shrink-0 rounded-full bg-[#B9BE9C]" />
                  ) : null}
                  <span className="font-gsf text-[13px] leading-[19.5px] tracking-[-0.01em] text-ink-soft">
                    {badge.label}
                  </span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line transition-colors hover:bg-panel-olive"
              >
                <img src={iconLinkedin} alt="" className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line transition-colors hover:bg-panel-olive"
              >
                <img src={iconYoutube} alt="" className="h-[21px] w-[21px]" />
              </a>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Star className="h-[21px] w-[21px] fill-[#00B67A] text-[#00B67A]" />
              <p className="font-gsf text-[15px] font-semibold leading-[21px] tracking-[-0.01em] text-ink">
                4.7/5<span className="font-normal"> from givers</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Seal
                width="72px"
                height="72px"
                className="rounded-lg"
                icon={<Star className="h-5 w-5 text-ink" strokeWidth={1.5} />}
                label="Verified"
                caption="orgs"
              />
              <Seal
                width="65.13px"
                height="72px"
                className="rounded-lg"
                icon={<Star className="h-5 w-5 text-ink" strokeWidth={1.5} />}
                label="Secure"
                caption="giving"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-3.5">
          <p className="font-gsf text-[13px] leading-[19.5px] text-ink-soft">© 2026 AzarFaith</p>
          <div className="flex flex-wrap items-center gap-3.5">
            {legalLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="font-gsf text-[13px] leading-[19.5px] text-ink-soft transition-opacity hover:opacity-70"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
