import { useState } from "react";
import { CauseLightbox } from "@/components/app/CauseLightbox";
import { Link } from "@tanstack/react-router";
import { Calendar, Church, Link2, MapPin, Users } from "lucide-react";
import { Photo } from "@/components/app/Photo";
import {
  AppShell,
  Container,
  EmptyState,
  SectionHeading,
  Tag,
  VerifiedBadge,
  cardClass,
  smallHeadingClass,
} from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { GiveBox } from "@/components/app/GiveBox";
import { CampaignCard } from "@/components/app/CampaignCard";
import { formatMoney, type Campaign, type Org } from "@/lib/catalog";
import { dashboardCompactMoney as formatCompactMoney } from "@/lib/dashboard";
import { activityDate, isPublished } from "@/lib/discovery";
import { shareCause } from "@/lib/share-cause";
import { cn } from "@/lib/utils";

const orgCategoryLabel: Record<string, string> = {
  church: "Church",
  mission: "Mission",
  orphanage: "Orphanage",
  school: "Faith school",
  other: "Ministry",
};

const tiers = [
  { amount: 2000, name: "Friend", line: "A steady gift they can plan around." },
  { amount: 5000, name: "Partner", line: "Covers a real, recurring cost every month." },
  { amount: 10000, name: "Sponsor", line: "Carries a whole line of their monthly budget." },
];

/**
 * Organization page (after Buy Me a Coffee's creator page): a photo mosaic, who they are, and on
 * the right, give once or become a regular giver without leaving.
 */
export function OrganizationPublicView({
  organization: org,
  isOwner,
  onManage,
}: {
  organization: Org & { campaigns: Campaign[] };
  authenticated: boolean;
  isOwner: boolean;
  onManage: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photosOpen, setPhotosOpen] = useState(false);
  const published = isPublished(org);
  const campaigns = org.campaigns.filter(isPublished);
  const main = published
    ? (campaigns.find((c) => c.mode === "ongoing") ?? campaigns[0])
    : undefined;
  const ongoing = published
    ? campaigns.find((c) => c.mode === "ongoing" && c.frequencies?.includes("monthly"))
    : undefined;
  const givers = campaigns
    .flatMap((c) => c.donations.map((d) => ({ ...d, campaign: c.title })))
    .sort((a, b) => Date.parse(b.createdAt ?? b.date) - Date.parse(a.createdAt ?? a.date))
    .slice(0, 5);
  const photos = org.photos.length ? org.photos : [];
  const share = () => void shareCause("org", org.id, org.name, true);
  return (
    <AppShell
      bottomBar={
        main ? (
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-sm text-muted-ink">
              <span className="font-semibold text-ink">
                {org.supporters.toLocaleString()} givers
              </span>{" "}
              support {org.name}
            </p>
            <button
              type="button"
              onClick={() =>
                document.getElementById("give")?.scrollIntoView({ behavior: "smooth" })
              }
              className={btn("primary")}
            >
              Give
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="grid h-[200px] grid-cols-3 gap-1 overflow-hidden bg-panel sm:h-[260px] md:grid-cols-4 lg:h-[300px]">
        {[...photos, ...photos].slice(0, 4).map((p, i) => (
          <button
            type="button"
            key={i}
            aria-label={"Enlarge organization photo " + (i + 1)}
            className={cn("h-full min-w-0 cursor-zoom-in", i === 3 && "hidden md:block")}
            onClick={() => {
              setPhotoIndex(i % photos.length);
              setPhotosOpen(true);
            }}
          >
            <Photo src={p} className="h-full" imgClassName="halftone" />
          </button>
        ))}
      </div>

      <CauseLightbox
        photos={photos}
        index={photoIndex}
        onIndex={setPhotoIndex}
        title={org.name}
        open={photosOpen}
        onOpenChange={setPhotosOpen}
      />
      <Container className="pb-16">
        <div className="flex flex-col gap-4 border-b border-line-soft pb-6 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
            <Photo
              src={photos[0]}
              className="relative -mt-12 h-20 w-20 shrink-0 rounded-card object-cover ring-4 ring-paper sm:-mt-16 sm:h-28 sm:w-28"
            />
            <div className="min-w-0 pb-1">
              <h1 className="flex flex-wrap items-center gap-2 font-display text-[clamp(26px,2.8vw,38px)] leading-tight tracking-[-0.02em] text-ink">
                {org.name}
                {published ? <VerifiedBadge label={null} /> : null}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-ink">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" strokeWidth={1.5} />
                  {org.supporters.toLocaleString()} givers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" strokeWidth={1.5} /> {org.location}
                </span>
                {org.verificationStatus !== "verified" ? (
                  <Tag>
                    {org.verificationStatus === "pending"
                      ? "Verification pending"
                      : org.isDraft
                        ? "Draft"
                        : org.reviewAction === "rejected"
                          ? "Not approved"
                          : "Not verified yet"}
                  </Tag>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <button type="button" className={btn("secondary", "sm")} onClick={onManage}>
                Manage organization
              </button>
            )}
            <button
              type="button"
              onClick={share}
              className={cn(btn("secondary", "sm"), "self-start sm:self-auto")}
            >
              <Link2 className="h-4 w-4" strokeWidth={1.75} /> Share
            </button>
          </div>
        </div>

        {!published && (
          <p role="status" className="mt-5 rounded-field bg-panel p-4 text-sm text-ink-soft">
            Organization preview. This organization is not public yet.{" "}
            {org.reviewReason ||
              "Once approved, donors will be able to discover and support its campaigns."}
          </p>
        )}
        <div className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-10">
            <section className={cn(cardClass, "flex flex-col gap-4 p-5 sm:p-6")}>
              <p className={smallHeadingClass}>About {org.name}</p>
              <p className="text-[17px] font-medium leading-[1.5] text-ink">{org.tagline}</p>
              <p className="text-[15px] leading-[1.7] text-ink-soft">{org.bio}</p>
              <dl className="grid gap-3 border-t border-line-soft pt-4 sm:grid-cols-3">
                {[
                  {
                    icon: Church,
                    label:
                      org.category === "other"
                        ? org.otherCategoryLabel || "Ministry"
                        : orgCategoryLabel[org.category],
                    sub: org.denomination,
                  },
                  { icon: Calendar, label: `Since ${org.founded}`, sub: "Founded" },
                  {
                    icon: Users,
                    label: formatCompactMoney(org.totalReceived),
                    sub: "Received on AzarFaith",
                  },
                ].map((f) => (
                  <div key={f.sub} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-ink-soft">
                      <f.icon className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{f.label}</span>
                      <span className="block truncate text-[12px] text-muted-ink">{f.sub}</span>
                    </span>
                  </div>
                ))}
              </dl>
            </section>

            <section className="flex flex-col gap-5">
              <SectionHeading
                aside={<span className="text-sm text-muted-ink">{campaigns.length}</span>}
              >
                Campaigns
              </SectionHeading>
              {campaigns.length ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {campaigns.map((c) => (
                    <CampaignCard key={c.id} campaign={c} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No campaigns yet"
                  body={`${org.name} hasn't started a campaign. Share their page so they're ready when they do.`}
                  action={
                    <button type="button" onClick={share} className={btn("secondary")}>
                      Copy link
                    </button>
                  }
                />
              )}
            </section>

            {org.links.length ? (
              <section className={cn(cardClass, "flex flex-col gap-4 p-5 sm:p-6")}>
                <p className={smallHeadingClass}>Relevant public links</p>
                <ul className="space-y-2 text-sm text-ink-soft">
                  {org.links
                    .filter((link) => /^https?:\/\//i.test(link))
                    .map((link, i) => (
                      <li key={i}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all underline underline-offset-2"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                </ul>
              </section>
            ) : null}

            {givers.length ? (
              <section className="flex flex-col gap-5">
                <SectionHeading>Recent givers</SectionHeading>
                <ul className="flex flex-col gap-5">
                  {givers.map((g) => (
                    <li key={g.id} className="flex gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel text-sm font-semibold text-ink-soft">
                        {g.donor.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink-soft">
                          <span className="font-medium text-ink">{g.donor}</span> gave{" "}
                          {formatMoney(g.amount)} to {g.campaign}
                        </p>
                        {g.note ? (
                          <p className="mt-1.5 max-w-[560px] rounded-[14px] rounded-tl-[4px] bg-panel px-3.5 py-2.5 text-sm leading-[1.5] text-ink">
                            {g.note}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[12px] text-subtle">{activityDate(g)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            {main ? (
              <div
                id="give"
                className={cn(cardClass, "flex scroll-mt-20 flex-col gap-4 p-5 sm:p-6")}
              >
                <div>
                  <p className="font-display text-[22px] leading-tight text-ink">
                    Give to {org.name}
                  </p>
                  <p className="mt-1 text-[13px] text-muted-ink">
                    Your gift goes to{" "}
                    <Link
                      to="/campaign/$id"
                      params={{ id: main.id }}
                      className="underline underline-offset-2 hover:text-ink"
                    >
                      {main.title}
                    </Link>
                  </p>
                </div>
                <GiveBox campaign={main} />
              </div>
            ) : null}

            {ongoing ? (
              <div className={cn(cardClass, "flex flex-col gap-3 p-5 sm:p-6")}>
                <p className="font-display text-[20px] leading-tight text-ink">
                  Become a regular giver
                </p>
                <ul className="flex flex-col gap-2.5">
                  {tiers.map((t) => (
                    <li
                      key={t.name}
                      className="flex items-center gap-3 rounded-field border border-line-soft p-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {t.name}{" "}
                          <span className="font-normal text-muted-ink">
                            {formatMoney(t.amount)} a month
                          </span>
                        </p>
                        <p className="text-[13px] text-muted-ink">{t.line}</p>
                      </div>
                      <Link
                        to="/donate/$id"
                        params={{ id: ongoing.id }}
                        search={{ freq: "monthly", amount: String(t.amount) }}
                        className={btn("secondary", "sm")}
                      >
                        Join
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="text-[12px] text-muted-ink">Change or stop any time in My giving.</p>
              </div>
            ) : null}
          </aside>
        </div>
      </Container>
    </AppShell>
  );
}
