import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Photo } from "@/components/app/Photo";
import { ProfileSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import { Calendar, Church, HeartHandshake, Link2, MapPin, Repeat2, Target } from "lucide-react";
import { toast } from "sonner";
import {
  AppShell,
  Container,
  EmptyState,
  SectionHeading,
  StatTile,
  Tag,
  VerifiedBadge,
  pageTitleClass,
  panelClass,
  sectionTitleClass,
} from "@/components/app/AppShell";
import { btnPrimary, btnSecondary } from "@/components/app/btn";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";
import { formatCompactMoney, orgs as orgSeed } from "@/lib/mock";

export const Route = createFileRoute("/_app/org/$id")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <ProfileSkeleton label="Loading organization" />,
  ...pending,
  head: ({ params }) => {
    const org = orgSeed.find((o) => o.id === params.id);
    return { meta: [{ title: org ? `${org.name} — AzarFaith` : "Organization — AzarFaith" }] };
  },
  component: OrgProfile,
});

const orgCategoryLabel: Record<string, string> = {
  church: "Church",
  mission: "Mission / Outreach",
  orphanage: "Orphanage",
  school: "Faith school",
  other: "Ministry",
};

function OrgProfile() {
  const { id } = Route.useParams();
  const orgs = useApp((s) => s.orgs);
  const allCampaigns = useApp((s) => s.campaigns);

  const org = orgs.find((o) => o.id === id);
  if (!org) throw notFound();

  const campaigns = allCampaigns.filter((c) => org.campaignIds.includes(c.id));
  const ongoing = campaigns.filter((c) => c.mode === "ongoing");
  const oneTime = campaigns.filter((c) => c.mode === "one-time");
  const [cover, ...gallery] = org.photos;

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast("Profile link copied");
  };

  return (
    <AppShell>
      <section className="border-b border-line-soft py-10 md:py-14">
        <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="flex flex-wrap items-center gap-3 text-[15px] text-muted-ink">
              {orgCategoryLabel[org.category]}
              {org.verificationStatus === "verified" ? (
                <VerifiedBadge />
              ) : (
                <Tag>
                  {org.verificationStatus === "pending" ? "Verification pending" : "Unverified"}
                </Tag>
              )}
            </p>
            <h1 className={pageTitleClass}>{org.name}</h1>
            <p className="text-lg leading-[27.9px] tracking-[-0.02em] text-ink-soft">
              {org.tagline}
            </p>
            <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-ink">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" strokeWidth={1.5} /> {org.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" strokeWidth={1.5} /> Est. {org.founded}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Church className="h-4 w-4" strokeWidth={1.5} /> {org.denomination}
              </span>
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {ongoing[0] ? (
                <Link
                  to="/donate/$id"
                  params={{ id: ongoing[0].id }}
                  search={{ freq: ongoing[0].frequencies?.[0] ?? "monthly" }}
                  className={btnPrimary}
                >
                  <Repeat2 className="h-4 w-4" strokeWidth={1.5} /> Give monthly
                </Link>
              ) : null}
              {oneTime[0] ? (
                <Link
                  to="/donate/$id"
                  params={{ id: oneTime[0].id }}
                  search={{ freq: "" }}
                  className={ongoing[0] ? btnSecondary : btnPrimary}
                >
                  Give once
                </Link>
              ) : null}
              <button type="button" onClick={copyLink} className={btnSecondary}>
                <Link2 className="h-4 w-4" strokeWidth={1.5} /> Share
              </button>
            </div>
          </div>
          {cover ? (
            <Photo
              src={cover}
              loading="eager"
              className="aspect-[4/3] w-full rounded-2xl lg:aspect-[520/440]"
            />
          ) : null}
        </Container>
      </section>

      <Container className="flex flex-col gap-16 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-6">
          <StatTile value={formatCompactMoney(org.totalReceived)} label="Total received" />
          <StatTile value={org.supporters.toLocaleString()} label="Givers" />
          <StatTile value={campaigns.length} label="Active campaigns" />
          <StatTile value={org.founded} label="Founded" />
        </div>

        <section className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <SectionHeading>About</SectionHeading>
          <p className="max-w-[820px] text-lg leading-[27.9px] tracking-[-0.02em] text-ink-soft">
            {org.bio}
          </p>
        </section>

        {gallery.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading>From the field</SectionHeading>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {org.photos.map((photo, i) => (
                <Photo key={i} src={photo} className="aspect-square w-full rounded-2xl" />
              ))}
            </div>
          </section>
        ) : null}

        {ongoing.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              aside={
                <span className="hidden items-center gap-1.5 text-sm text-muted-ink sm:inline-flex">
                  <Repeat2 className="h-4 w-4" strokeWidth={1.5} /> Standing support
                </span>
              }
            >
              Ongoing support
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {ongoing.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </section>
        ) : null}

        {oneTime.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              aside={
                <span className="hidden items-center gap-1.5 text-sm text-muted-ink sm:inline-flex">
                  <Target className="h-4 w-4" strokeWidth={1.5} /> With a goal
                </span>
              }
            >
              Specific campaigns
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {oneTime.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </section>
        ) : null}

        {campaigns.length === 0 ? (
          <EmptyState
            icon={<HeartHandshake className="h-5 w-5" strokeWidth={1.5} />}
            title="No campaigns yet"
            body={`${org.name} hasn't published a campaign yet. Share their profile so they're ready when they do.`}
            action={
              <button type="button" onClick={copyLink} className={btnSecondary}>
                Copy profile link
              </button>
            }
          />
        ) : null}

        <section
          className={`${panelClass} flex flex-col items-start gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10`}
        >
          <div className="flex max-w-[620px] flex-col gap-2">
            <h2 className={sectionTitleClass}>Help {org.name} reach more people</h2>
            <p className="text-base leading-[1.6] text-ink-soft">
              One share puts their work in front of someone who has never heard of it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={copyLink} className={btnSecondary}>
              <Link2 className="h-4 w-4" strokeWidth={1.5} /> Copy link
            </button>
            {ongoing[0] ? (
              <Link
                to="/donate/$id"
                params={{ id: ongoing[0].id }}
                search={{ freq: ongoing[0].frequencies?.[0] ?? "monthly" }}
                className={btnPrimary}
              >
                Become a regular giver
              </Link>
            ) : null}
          </div>
        </section>
      </Container>
    </AppShell>
  );
}
