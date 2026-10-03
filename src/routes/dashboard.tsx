import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";
import { me } from "@/lib/mock";
import nudgeOrg from "@/assets/dashboard/nudge-org.png";
import nudgePayment from "@/assets/dashboard/nudge-payment.png";
import nudgeCampaign from "@/assets/dashboard/nudge-campaign.png";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const nudgeBody =
  "Create your free account and support churches, missionaries, and faith-based organizations across Nigeria.";

function Dashboard() {
  const campaigns = useApp((s) => s.campaigns);
  const firstName = me.name.split(" ")[0];
  const preview = campaigns.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-4xl tracking-tight text-[#232323] sm:text-5xl">
              Welcome, {firstName}
            </h1>
            <p className="text-sm text-[#232323]">Welcome back to your account dashboard.</p>
          </div>

          <div className="flex flex-col gap-6 border-y border-[#ebebeb] py-9">
            <p className="text-sm font-bold text-[#232323]">Up Next for you</p>
            <div className="grid gap-6 md:grid-cols-3">
              <NudgeCard
                sticker={nudgeOrg}
                title="Set up your organization"
                body={nudgeBody}
                cta="Create Organization"
                to="/register-org"
              />
              <NudgeCard
                sticker={nudgePayment}
                title="Verify your payment details"
                body={nudgeBody}
                cta="Add Account details"
                to="/profile"
              />
              <NudgeCard
                sticker={nudgeCampaign}
                title="Publish your first Campaign"
                body={nudgeBody}
                cta="Start New Campaign"
                to="/create"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#232323]">Discover</p>
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
      </div>
    </div>
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
    <div className="flex flex-col gap-3.5 rounded-lg bg-[#fff6f2] p-7">
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
