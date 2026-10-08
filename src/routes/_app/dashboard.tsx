import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, Landmark, Megaphone, Plus } from "lucide-react";
import { DashboardSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import {
  AppShell,
  Container,
  EmptyState,
  PageHeader,
  SectionHeading,
  cardClass,
} from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";
import { me } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  loader: () => simulateNetwork(),
  pendingComponent: DashboardSkeleton,
  ...pending,
  head: () => ({ meta: [{ title: "Manage — AzarFaith" }] }),
  component: Manage,
});

const setup: { icon: LucideIcon; title: string; body: string; cta: string; to: string }[] = [
  {
    icon: Building2,
    title: "Register your organization",
    body: "Give your church or ministry a verified home so givers know exactly who they are supporting.",
    cta: "Register your org",
    to: "/register-org",
  },
  {
    icon: Landmark,
    title: "Add your payout account",
    body: "We check the account once, then every gift goes straight there.",
    cta: "Add account",
    to: "/profile",
  },
  {
    icon: Megaphone,
    title: "Publish your first campaign",
    body: "Tell your story, set a goal or a giving rhythm, and share it with your people.",
    cta: "Start a campaign",
    to: "/create",
  },
];

/** Manage: where an organization gets ready to receive gifts and runs its campaigns. */
function Manage() {
  const campaigns = useApp((s) => s.campaigns);
  const mine = campaigns.filter((c) => c.raiser.name === me.name);
  const firstName = me.name.split(" ")[0];

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        lead="Set up your organization and run your campaigns from here."
        actions={
          <Link to="/create" className={btn("primary")}>
            <Plus className="h-4 w-4" strokeWidth={2} /> Start a campaign
          </Link>
        }
      />

      <Container className="flex flex-col gap-14 py-10 md:py-14">
        <section className="flex flex-col gap-6">
          <SectionHeading>Get ready to receive gifts</SectionHeading>
          <ol className={cn(cardClass, "divide-y divide-line-soft")}>
            {setup.map((s, i) => (
              <li
                key={s.title}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6"
              >
                <span className="flex items-center gap-4 sm:contents">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-panel text-ink">
                    <s.icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-gsf text-[15px] font-semibold text-ink">
                      {i + 1}. {s.title}
                    </span>
                    <span className="block font-gsf text-sm leading-5 text-muted-ink">
                      {s.body}
                    </span>
                  </span>
                </span>
                <Link
                  to={s.to as "/"}
                  className={cn(btn("secondary", "sm"), "self-start sm:self-auto")}
                >
                  {s.cta} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeading>Your campaigns</SectionHeading>
          {mine.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-5 w-5" strokeWidth={1.5} />}
              title="No campaigns yet"
              body="Your campaigns show up here with their gifts, updates and receipts."
              action={
                <Link to="/create" className={btn("primary")}>
                  Start a campaign
                </Link>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {mine.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </section>
      </Container>
    </AppShell>
  );
}
