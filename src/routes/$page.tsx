import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";
const pages: Record<string, { title: string; body: string[] }> = {
  about: {
    title: "About AzarFaith",
    body: [
      "AzarFaith connects givers with churches, missions, orphanages, schools and other faith-based ministries in Nigeria.",
      "Organizations submit their details, photos and registration evidence for review. Campaigns must be approved before they are available for public giving.",
      "Givers can support a specific need once, or sign in to manage ongoing support. Campaign creators share progress through updates, and confirmed gifts are recorded in giving history.",
    ],
  },
  verification: {
    title: "Organization and campaign verification",
    body: [
      "Organizations provide their details, mission, photos and registration evidence or a recommendation letter from a recognized parent ministry.",
      "The AzarFaith team reviews each submission and can approve it, request further information or reject it with a reason. Pending and rejected organizations and campaigns are not published to donors.",
      "The verified badge indicates platform approval. Read each campaign's details and updates before deciding to give.",
    ],
  },
  "give-once": {
    title: "Give once",
    body: [
      "You do not need an account to make a one-time gift. Open a published campaign, choose an amount and enter your name and receipt email.",
      "An anonymous gift hides your name from the public campaign, but your receipt still uses the name you entered. Checkout displays all fees and optional tips before payment.",
    ],
  },
  recurring: {
    title: "Recurring giving",
    body: [
      "Sign in to choose one of an ongoing campaign's available frequencies.",
      "Automatic giving requires your explicit consent and a reusable card authorization confirmed by Paystack. A reminder-based pledge never charges you automatically.",
      "Use My Giving to manage your gifts, change supported settings, or pause and cancel your own automatic support.",
    ],
  },
  "monthly-support": {
    title: "Ongoing support",
    body: [
      "Ongoing campaigns offer the frequencies selected by their creators. Sign in to manage automatic card giving or reminder-based pledges.",
      "Your giving history keeps confirmed donations and their receipts. Pausing or cancelling a recurring gift stops future scheduled charges; it does not reverse a completed donation.",
    ],
  },
  "payment-security": {
    title: "Payment security",
    body: [
      "Payment details are entered through Paystack's hosted checkout. AzarFaith does not collect your card number or PIN.",
      "Saved cards show limited card metadata. Charging a saved card for a new gift requires confirmation of the displayed total. Recurring card giving requires separate consent.",
      "A donation is only counted after payment verification. If checkout is interrupted, check the existing payment result before starting another payment.",
    ],
  },
  payouts: {
    title: "Receiving campaign funds",
    body: [
      "Save your payout bank details in your profile. Organizations can use the creator's eligible account or their own account where supported.",
      "Your payout view shows the recorded net balance and transfer history. A payout request is reviewed by the team and is not itself a bank transfer.",
      "An administrator authorizes release through Paystack. Processing, failed and successful transfers remain distinct in the payout history.",
    ],
  },
  "update-posts": {
    title: "Keeping supporters informed",
    body: [
      "Campaign creators can publish updates from their campaign management screen. Updates appear on the campaign and notify supporters according to the configured notification flow.",
      "Share specific progress and relevant photos. Do not include private donor information or bank credentials in public updates.",
    ],
  },
  "help-center": {
    title: "Help with giving",
    body: [
      "For a payment that is still pending, open its callback page and use Check payment status. Do not start another gift until you have checked the original payment.",
      "For your receipts and recurring gifts, sign in and open My Giving. Creators can find their organizations and campaigns under Manage.",
    ],
  },
  support: {
    title: "Find the right support screen",
    body: [
      "Manage your receipts and recurring gifts in My Giving. Manage your organizations, campaigns and review feedback in Manage.",
      "For an interrupted payment, use the payment status check on the original checkout result. The platform never treats an unconfirmed payment as a successful gift.",
    ],
  },
};
export const Route = createFileRoute("/$page")({
  beforeLoad: ({ params }) => {
    if (!pages[params.page]) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${pages[params.page]?.title ?? "Page not found"} | AzarFaith` }],
  }),
  component: Content,
});
function Content() {
  const { page } = Route.useParams();
  const doc = pages[page];
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
          AzarFaith guide
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl">{doc.title}</h1>
        <div className="mt-10 space-y-6 text-lg leading-8 text-ink-soft">
          {doc.body.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/discover" className="public-button">
            Discover causes
          </Link>
          <Link to="/story" className="public-button-secondary">
            How giving works
          </Link>
        </div>
      </article>
    </PublicShell>
  );
}
