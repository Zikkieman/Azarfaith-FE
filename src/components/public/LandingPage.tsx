import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, ArrowRight, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAppSelector } from "@/app/hooks";
import { discoverCampaigns } from "@/features/catalog/api";
import { CampaignCard } from "./CatalogCards";
import { CatalogError } from "./PublicShell";
import { OpenGiving } from "./OpenGiving";
const questions = [
  [
    "What is AzarFaith?",
    "A giving platform for churches, missions, orphanages, schools and other faith-based work across Nigeria.",
  ],
  [
    "Do I need an account to donate?",
    "One-time giving is available to guests. Enter your name and email for your receipt. Sign in to set up and manage recurring gifts.",
  ],
  [
    "What does the verified badge mean?",
    "The organization or campaign has been approved by the AzarFaith team. Pending and rejected submissions are not publicly available for giving.",
  ],
  [
    "What will I be charged?",
    "Checkout shows your donation, the currently configured platform fee and any optional tip to AzarFaith before you pay. No fixed fee is assumed here.",
  ],
  [
    "Can I pause recurring giving?",
    "Yes. Sign in and open My Giving to pause or cancel your own recurring gifts. Reminder-based pledges are not charged automatically.",
  ],
  [
    "How do I follow my gift?",
    "Read campaign updates and use your receipt reference. Signed-in donors can see confirmed gifts and receipts in My Giving.",
  ],
];
export function LandingPage() {
  const authenticated = useAppSelector((state) => Boolean(state.auth.user));
  const campaigns = useQuery({
    queryKey: ["landing", "featured"],
    queryFn: () => discoverCampaigns({ pageSize: 6 }),
  });
  const [word, setWord] = useState(0),
    [question, setQuestion] = useState<number | null>(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setWord((value) => (value + 1) % 3), 3500);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="public-layout min-h-screen overflow-x-clip bg-paper font-gsf text-ink">
      <Navbar />
      <main>
        <section className="relative isolate flex min-h-[75svh] flex-col items-center justify-center overflow-hidden px-5 py-20 text-center md:py-28">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#fff3cc_0%,#fff_70%)]"
          />
          <div className="grid size-20 place-items-center rounded-full bg-brand">
            <Flame className="size-10 fill-white text-white" />
          </div>
          <h1 className="mt-8 max-w-5xl font-display text-[clamp(42px,6.4vw,104px)] leading-[1.03] tracking-[-.035em]">
            You give in faith.
            <br />
            See the{" "}
            <span className="inline-block text-brand">{["fruit", "growth", "change"][word]}</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-ink-soft md:text-xl">
            Support verified churches, missions and ministries across Nigeria. Follow confirmed
            gifts through receipts and campaign updates.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/discover" className="public-button">
              Start giving <ArrowRight className="size-4" />
            </Link>
            <a href="#how-it-works" className="public-button-secondary">
              See how it works
            </a>
          </div>
        </section>
        <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-10">
          <OpenGiving />
        </div>
        <section id="how-it-works" className="mx-auto max-w-[1280px] px-5 py-16 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-ink">
            Your giving journey
          </p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">Find. Give. Follow.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              [
                "Find a verified cause",
                "Read the story, view the organization and choose the need you want to support.",
              ],
              [
                "Give on your terms",
                "Choose a one-time gift, an automatic recurring gift or a reminder-based pledge. Checkout shows the full breakdown.",
              ],
              [
                "Follow the work",
                "Receive a confirmed receipt and read progress updates from the campaign creator.",
              ],
            ].map(([title, body], index) => (
              <div key={title} className="public-panel p-6">
                <span className="text-sm font-semibold text-brand-ink">0{index + 1}</span>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
          <Link
            to="/story"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
          >
            See the giving journey <ArrowRight className="size-4" />
          </Link>
        </section>
        <section className="mx-auto max-w-[1280px] px-5 py-16 md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-4xl">Featured campaigns</h2>
            <Link to="/discover" className="text-sm font-semibold underline">
              View all causes
            </Link>
          </div>
          <div className="mt-8">
            {campaigns.isPending ? (
              <p role="status">Loading campaigns...</p>
            ) : campaigns.isError ? (
              <CatalogError retry={() => void campaigns.refetch()} />
            ) : campaigns.data.items.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.data.items.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <p className="public-panel p-8 text-ink-soft">
                Published campaigns will appear here when available.
              </p>
            )}
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-ink">FAQ</p>
          <h2 className="mt-4 font-display text-4xl">Frequently asked questions</h2>
          <div className="mt-8 border-b border-line-soft">
            {questions.map(([title, answer], index) => (
              <div className="border-t border-line-soft" key={title}>
                <button
                  type="button"
                  aria-expanded={question === index}
                  aria-controls={`landing-faq-${index}`}
                  onClick={() => setQuestion(question === index ? null : index)}
                  className="flex w-full items-center justify-between gap-5 py-5 text-left text-base font-medium"
                >
                  {title}
                  <ChevronDown
                    className={`size-5 shrink-0 transition-transform ${question === index ? "rotate-180" : ""}`}
                  />
                </button>
                <p
                  id={`landing-faq-${index}`}
                  hidden={question !== index}
                  className="pb-6 leading-7 text-ink-soft"
                >
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-[#ffe228] px-5 py-20 text-center">
          <h2 className="font-display text-4xl md:text-6xl">
            Someone is already doing God's work.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-ink-soft">
            Help them keep going. Find a cause to support, or share the work of your own
            organization.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/discover" className="public-button">
              Find a cause
            </Link>
            <Link
              to={authenticated ? "/register-org" : "/signup"}
              className="public-button-secondary"
            >
              Register your organization
            </Link>
          </div>
        </section>
      </main>
      <nav
        aria-label="Learn about AzarFaith"
        className="mx-auto flex max-w-[1280px] flex-wrap gap-6 px-5 py-8 text-sm md:px-10"
      >
        <Link to="/$page" params={{ page: "about" }}>
          About
        </Link>
        <Link to="/$page" params={{ page: "verification" }}>
          Verification
        </Link>
        <Link to="/story">How giving works</Link>
        <Link to="/map">Open giving</Link>
        <Link to="/$page" params={{ page: "help-center" }}>
          Help center
        </Link>
      </nav>
      <Footer />
    </div>
  );
}
