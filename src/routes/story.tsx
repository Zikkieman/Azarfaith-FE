import { Link, createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";
export const Route = createFileRoute("/story")({
  head: () => ({ meta: [{ title: "How your giving works | AzarFaith" }] }),
  component: Story,
});
function Story() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
          Giving with clarity
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl">
          You give in faith. See the journey.
        </h1>
        <div className="mt-12 space-y-8">
          {[
            [
              "Find a cause",
              "Browse published campaigns and verified organizations. Read the story, view the photos and choose a cause you want to support.",
            ],
            [
              "Choose how to give",
              "Give once as a guest with your name and receipt email, or sign in to manage automatic recurring giving and reminder-based pledges.",
            ],
            [
              "Confirm your payment",
              "Checkout shows the donation, platform fee and optional AzarFaith tip before payment. A receipt is sent after Paystack confirms your gift.",
            ],
            [
              "Follow the work",
              "Read the creator's campaign updates and view your giving history. You can pause or cancel your own recurring gifts from My Giving.",
            ],
          ].map(([title, text], index) => (
            <section key={title} className="public-panel p-6">
              <p className="text-xs font-semibold text-orange-700">0{index + 1}</p>
              <h2 className="mt-3 text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-7 text-ink-soft">{text}</p>
            </section>
          ))}
        </div>
        <Link to="/discover" className="public-button mt-10">
          Find your first cause
        </Link>
      </div>
    </PublicShell>
  );
}
