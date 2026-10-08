import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Container, eyebrowClass } from "@/components/app/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";
import { me } from "@/lib/mock";
import nudgeOrg from "@/assets/dashboard/nudge-org.png";
import nudgePayment from "@/assets/dashboard/nudge-payment.png";
import nudgeCampaign from "@/assets/dashboard/nudge-campaign.png";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Manage — AzarFaith" }] }),
  component: Dashboard,
});

function Dashboard() {
  const campaigns = useApp((s) => s.campaigns);
  const firstName = me.name.split(" ")[0];
  const preview = campaigns.slice(0, 3);

  return (
    <AppShell>
      <Container className="py-12 md:py-16">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className={eyebrowClass}>Manage</p>
            <h1 className="font-display text-[clamp(32px,3.7vw,56px)] leading-[1.08] tracking-[-0.01em] text-[#130E30]">
              Welcome, {firstName}
            </h1>
            <p className="text-lg leading-[27.9px] tracking-[-0.02em] text-[#4A4660]">
              Welcome back to your account dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-6 border-y border-[#D9DDBC] py-9">
            <p className={eyebrowClass}>Up next for you</p>
            <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
              <NudgeCard
                sticker={nudgeOrg}
                title="Set up your organization"
                body="Give your church or ministry a verified home on AzarFaith so givers know exactly who they are supporting."
                cta="Register your org"
                to="/register-org"
              />
              <NudgeCard
                sticker={nudgePayment}
                title="Verify your payment details"
                body="Add the account your payouts should land in. We check it once, then every gift goes straight there."
                cta="Add account details"
                to="/profile"
              />
              <NudgeCard
                sticker={nudgeCampaign}
                title="Publish your first campaign"
                body="Tell your story, set a goal or a giving rhythm, and share it with the people who already believe in your work."
                cta="Start a campaign"
                to="/create"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className={eyebrowClass}>Discover</p>
              <Link
                to="/discover"
                className="text-sm font-medium text-[#8c8c8c] hover:text-[#232323]"
              >
                View more
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {preview.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}

function NudgeCard({
  sticker,
  title,
  body,
  cta,
  to,
}: {
  sticker: string;
  title: string;
  body: string;
  cta: string;
  to: string;
}) {
  return (
    <div className="flex w-[80%] shrink-0 snap-start flex-col gap-3.5 rounded-lg bg-[#fff6f2] p-6 md:w-auto md:p-7">
      <img src={sticker} alt="" className="h-16 w-auto object-contain" />
      <div className="flex flex-col gap-3.5 text-sm text-[#232323]">
        <p className="font-bold">{title}</p>
        <p>{body}</p>
        <Link to={to as "/"} className="font-medium underline underline-offset-2">
          {cta}
        </Link>
      </div>
    </div>
  );
}
