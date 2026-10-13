import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Footer as LandingFooter } from "@/components/landing/Footer";
import { SiteNav } from "@/components/landing/SiteNav";
import { LandingDataProvider } from "@/components/landing/data";
import { PublicShell } from "@/components/public/PublicShell";
import { landingGuidePreviews } from "@/lib/landing-guides";
import { useScrollProgress } from "@/lib/motion";

type Section = { heading: string; paragraphs: string[]; bullets?: string[]; note?: string };
type LegalDoc = { title: string; lead: string; sections: Section[] };

const legalPages: Record<string, LegalDoc> = {
  terms: {
    title: "Terms of Service",
    lead: "These terms govern how givers, churches, missionaries, orphanages and faith-based organizations use AzarFaith to run campaigns, receive support and settle Naira payouts. By creating an account or giving through the platform, you agree to them in full.",
    sections: [
      { heading: "1. Acceptance of these terms", paragraphs: ["AzarFaith is a faith-based giving platform for givers and verified ministries across Nigeria. These Terms bind you; if you do not agree, do not use the platform.", "By signing up, donating, submitting a payout request or otherwise using AzarFaith, you accept these terms, our Privacy Policy and our Cookie Policy. If you act for an organization, you confirm you can bind it."] },
      { heading: "2. Eligibility and your account", paragraphs: ["You must be at least 18 to create an account, give or receive funds on AzarFaith. You are responsible for keeping your login credentials confidential and for activity under your account."], bullets: ["Use accurate, verifiable information that matches your identity or organization documents.", "Do not share, sell or transfer an account, or create another account to evade suspension.", "Extra verification may be required before payouts."] },
      { heading: "3. Campaigns, verification and donations", paragraphs: ["Organizations submit their details, supporting documents and payout account for review before campaigns can receive donations. Campaign owners must describe the need honestly and use funds for the stated purpose.", "AzarFaith charges a 2.5% platform fee on each donation. The fee and any optional tip are shown before payment, and the platform fee is deducted from the amount available to the organization."], note: "Verified organizations may issue a donation receipt for your records. AzarFaith does not give tax advice; speak to your own adviser." },
      { heading: "4. Payouts and settlement", paragraphs: ["Verified organizations request a payout to the Nigerian bank account on file. An administrator reviews the request and, when released, Paystack processes the transfer. Bank clearing cycles and open disputes can affect settlement time.", "We may pause a campaign or payout while investigating a document issue, suspected fraud or a giver dispute."] },
      { heading: "5. Prohibited use, suspension and liability", paragraphs: ["Do not use AzarFaith for fraud, impersonation, money laundering, forged documents, hate speech, prohibited fundraising or any activity that breaches Nigerian law or a payment provider's rules.", "We may suspend or close an account where these terms are breached or verification fails. AzarFaith provides technology and verification workflows; we do not guarantee a campaign reaches its goal or produces a particular outcome."] },
      { heading: "6. Governing law and contact", paragraphs: ["These terms are governed by the laws of Lagos State, Nigeria. Send account, donation and payout questions to support@azarfaith.ng, and legal or regulatory questions to legal@azarfaith.ng."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lead: "This policy explains what personal data AzarFaith collects from givers and faith-based organizations, why we process it under the Nigeria Data Protection Act 2023, who we share it with, and the rights you can exercise at any time.",
    sections: [
      { heading: "1. Information we collect", paragraphs: ["We collect only what a trusted giving platform needs to run accounts, campaigns, donations, verification and payouts."], bullets: ["Account data: name, email, phone, password hash, role and organization affiliation.", "Campaign data: descriptions, beneficiary information, images and verification documents.", "Donation and payout data: amounts, transaction references, bank-account verification and settlement history."] },
      { heading: "2. Why we process your data", paragraphs: ["We process personal data to provide the requested service, meet legal obligations and keep the platform safe."], bullets: ["To create and secure accounts, verify organizations and process donations and payouts.", "To prevent fraud and money laundering, resolve disputes and send service messages.", "To improve the platform using aggregated or pseudonymised usage information."] },
      { heading: "3. Lawful basis, cookies and processors", paragraphs: ["We rely on contract performance for donations and payouts, legal obligation for financial records, consent for marketing and non-essential cookies, and legitimate interests for fraud prevention and security.", "Payment providers, cloud hosting, email and analytics providers process data on our instructions. We do not sell personal data."], note: "Analytics and marketing cookies stay off until you consent. Essential session and security cookies are necessary to provide the platform." },
      { heading: "4. Retention and international transfers", paragraphs: ["We retain account, donation and payout records for the period required for the service and applicable financial, tax, fraud-prevention and audit obligations. Where a processor stores data outside Nigeria, we use safeguards required by the NDPA."] },
      { heading: "5. Your rights and contact", paragraphs: ["Subject to applicable law, you may access, correct, delete, object to or port your personal data, and withdraw consent where processing relies on it. You can request account deletion from the data-deletion page or contact support@azarfaith.ng. Legal and regulatory enquiries can be sent to legal@azarfaith.ng."] },
    ],
  },
  "legal-notices": {
    title: "Legal Notices",
    lead: "Formal notices describing who operates AzarFaith, what the service does, how our name and marks are protected, and the limits of the information published on this platform.",
    sections: [
      { heading: "1. The service", paragraphs: ["AzarFaith is a technology platform that connects givers with churches, missionaries, orphanages and faith-based organizations in Nigeria. We provide campaign pages, donation processing, verification workflows, payout and reporting tools.", "AzarFaith is not a bank, charity, religious denomination or investment platform. We do not endorse a theological position, ministry or beneficiary listed on the platform."] },
      { heading: "2. Entity, contact and brand", paragraphs: ["Requests should be addressed by function so they reach the appropriate team."], bullets: ["Legal, regulatory and rights enquiries: legal@azarfaith.ng.", "Account, donation and payout support: support@azarfaith.ng.", "The AzarFaith name, wordmark and logos may not be used without permission."] },
      { heading: "3. Third-party links, verification and availability", paragraphs: ["Campaigns and organization profiles can link to third-party websites. Those sites operate independently, and a link does not mean AzarFaith endorses their content or practices.", "Verification means we reviewed information supplied by an organization. It is a trust signal, not a guarantee of how funds will be spent. Campaign totals, payout times and review statuses may change as transactions clear and reviews conclude."] },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    lead: "This policy explains the session, preference, analytics and marketing cookies AzarFaith uses, how long they last, and how you can withdraw consent or manage them in your browser.",
    sections: [
      { heading: "1. Essential cookies", paragraphs: ["Essential cookies keep you signed in, protect forms against forgery, balance requests across our servers and record your cookie choices. They are necessary for the platform to work."], bullets: ["Session cookie: holds your signed-in session until it expires or you sign out.", "Security token: protects account, donation and payout forms during the session.", "Consent cookie: remembers your cookie preference for up to 12 months."] },
      { heading: "2. Preference, analytics and marketing cookies", paragraphs: ["Preference cookies remember selected settings. Analytics cookies are enabled only after consent and help us understand, in aggregate, where visitors experience friction. Marketing cookies are optional and measure campaign messages; refusing them does not limit access to campaigns or receipts."] },
      { heading: "3. Managing consent", paragraphs: ["You can withdraw consent through cookie settings, clear AzarFaith site data in your browser, or contact support@azarfaith.ng. Withdrawing consent does not affect processing before withdrawal or essential cookies needed to deliver the service."] },
    ],
  },
};

const pages: Record<string, { title: string; body: string[] }> = {
  ...landingGuidePreviews,
  about: { title: "About AzarFaith", body: ["AzarFaith connects givers with churches, missions, orphanages, schools and other faith-based ministries in Nigeria.", "Organizations submit their details, photos and registration evidence for review. Campaigns must be approved before they are available for public giving."] },
  verification: { title: "Organization and campaign verification", body: ["Organizations provide their details, mission, photos and registration evidence or a recommendation letter from a recognized parent ministry.", "The AzarFaith team reviews each submission and can approve it, request further information or reject it with a reason. Pending and rejected organizations and campaigns are not published to donors."] },
  "give-once": { title: "Give once", body: ["You do not need an account to make a one-time gift. Open a published campaign, choose an amount and enter your name and receipt email."] },
  recurring: { title: "Recurring giving", body: ["Sign in to choose one of an ongoing campaign's available frequencies. Use My Giving to pause or cancel your own automatic support."] },
  "monthly-support": { title: "Ongoing support", body: ["Ongoing campaigns offer frequencies selected by their creators. Your giving history keeps confirmed donations and receipts."] },
  "payment-security": { title: "Payment security", body: ["Payment details are entered through Paystack's hosted checkout. AzarFaith does not collect your card number or PIN."] },
  payouts: { title: "Receiving campaign funds", body: ["Save payout bank details in your profile. Payout requests are reviewed before Paystack processes a transfer."] },
  "update-posts": { title: "Keeping supporters informed", body: ["Campaign creators can publish updates from their management screen. Updates appear on campaigns and notify supporters."] },
  "help-center": { title: "Help with giving", body: ["For a pending payment, use the payment callback page to check its status before starting another gift."] },
  support: { title: "Find the right support screen", body: ["Manage receipts and recurring gifts in My Giving. Manage organizations and campaigns in Manage."] },
};

export const Route = createFileRoute("/$page")({
  beforeLoad: ({ params }) => {
    if (!legalPages[params.page] && !pages[params.page]) throw notFound();
  },
  head: ({ params }) => ({ meta: [{ title: `${legalPages[params.page]?.title ?? pages[params.page]?.title ?? "Page not found"} | AzarFaith` }] }),
  component: Content,
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function LegalPage({ doc }: { doc: LegalDoc }) {
  const progress = useScrollProgress();
  return <LandingDataProvider><div className="min-h-screen overflow-x-clip bg-paper font-gsf text-heading">
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[#FE5102]" style={{ transform: `scaleX(${progress})` }} />
    <SiteNav />
    <main>
      <section className="border-b border-line bg-paper px-6 pb-14 pt-14 md:px-12 md:pt-20"><div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5"><p className="font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-ink-soft">Legal</p><h1 className="max-w-[900px] font-display text-[clamp(32px,3.7vw,56px)] leading-[1.08] tracking-[-0.03em] text-ink">{doc.title}</h1><p className="max-w-[760px] font-gsf text-lg leading-[27.9px] tracking-[-0.02em] text-ink-soft">{doc.lead}</p><p className="font-gsf text-[13px] leading-[19.5px] text-muted-ink">Last updated 8 October 2026</p></div></section>
      <section className="px-6 py-16 md:px-12 md:py-20"><div className="mx-auto grid w-full max-w-[1280px] gap-12 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]"><aside className="lg:sticky lg:top-24 lg:self-start"><p className="pb-3 font-gsf text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.1em] text-ink-soft">On this page</p><nav className="flex flex-col border-t border-line">{doc.sections.map((section) => <a key={section.heading} href={`#${slugify(section.heading)}`} className="border-b border-line py-3 font-gsf text-sm leading-[21px] text-ink transition-opacity hover:opacity-70">{section.heading}</a>)}</nav></aside>
        <article className="min-w-0 max-w-[820px]"><div className="flex flex-col gap-7">{doc.sections.map((section) => <section key={section.heading} className="flex flex-col gap-6 pt-4"><div className="h-px w-full bg-line" /><h2 id={slugify(section.heading)} className="scroll-mt-24 font-display text-[clamp(26px,2.2vw,36px)] leading-[1.14] tracking-[-0.03em] text-ink">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">{paragraph}</p>)}{section.bullets ? <ul className="flex flex-col gap-3">{section.bullets.map((bullet) => <li key={bullet} className="flex items-start gap-3"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#FE5102]" /><span className="font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">{bullet}</span></li>)}</ul> : null}{section.note ? <aside className="rounded-2xl border border-line bg-panel-olive p-6 font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">{section.note}</aside> : null}</section>)}</div></article>
      </div></section>
    </main>
    <LandingFooter />
  </div></LandingDataProvider>;
}

function Content() {
  const { page } = Route.useParams();
  const legal = legalPages[page];
  if (legal) return <LegalPage doc={legal} />;
  const doc = pages[page];
  return <PublicShell><article className="mx-auto max-w-3xl py-10"><p className="text-xs font-semibold uppercase tracking-widest text-orange-700">AzarFaith guide</p><h1 className="mt-4 font-display text-4xl md:text-6xl">{doc.title}</h1><div className="mt-10 space-y-6 text-lg leading-8 text-ink-soft">{doc.body.map((text) => <p key={text}>{text}</p>)}</div><div className="mt-10 flex flex-wrap gap-4"><Link to="/discover" className="public-button">Discover causes</Link><Link to="/story" className="public-button-secondary">How giving works</Link></div></article></PublicShell>;
}
