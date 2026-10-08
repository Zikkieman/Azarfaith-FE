import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { Photo } from "@/components/app/Photo";
import { CampaignDetailSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  TrendingUp,
  Link2,
  Facebook,
  MessageCircle,
  Send,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Container } from "@/components/app/AppShell";
import { useApp } from "@/lib/store";
import {
  campaigns as campaignSeed,
  formatCompactMoney,
  formatMoney,
  type Campaign,
  type Donation,
} from "@/lib/mock";

export const Route = createFileRoute("/_app/campaign/$id")({
  loader: () => simulateNetwork(),
  pendingComponent: CampaignDetailSkeleton,
  ...pending,
  head: ({ params }) => {
    const c = campaignSeed.find((x) => x.id === params.id);
    return { meta: [{ title: c ? `${c.title} — AzarFaith` : "Campaign — AzarFaith" }] };
  },
  component: CampaignDetail,
});

function CampaignDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { campaigns, orgs } = useApp();
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) throw notFound();

  const org = campaign.orgId ? orgs.find((o) => o.id === campaign.orgId) : null;
  const visibleUpdates = showAllUpdates ? campaign.updates : campaign.updates.slice(0, 1);

  return (
    <AppShell bottomBar={<MobileDonateBar campaign={campaign} />}>
      <Container className="py-6 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <main className="flex min-w-0 flex-col gap-10">
            <button
              type="button"
              onClick={() => router.history.back()}
              className="flex items-center gap-2 text-sm text-heading"
            >
              <ChevronLeft className="h-4 w-4" /> Go Back
            </button>

            <HeroSection campaign={campaign} org={org ? { id: org.id, name: org.name } : null} />

            {campaign.updates.length > 0 && (
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-[28px] font-normal leading-[1.14] tracking-[-0.01em] text-ink">
                    Updates
                  </h2>
                  <span className="rounded bg-panel px-2 py-0.5 text-sm text-heading">
                    {campaign.updates.length}
                  </span>
                </div>
                <div className="flex flex-col gap-6">
                  {visibleUpdates.map((u, i) => (
                    <UpdateItem key={u.id} update={u} isLatest={i === 0} />
                  ))}
                </div>
                {campaign.updates.length > 1 && !showAllUpdates && (
                  <button
                    type="button"
                    onClick={() => setShowAllUpdates(true)}
                    className="self-start text-sm font-medium text-heading"
                  >
                    See {campaign.updates.length - 1} more
                  </button>
                )}
              </section>
            )}

            <ShareSection campaign={campaign} />

            <OrganiserSection name={campaign.raiser.name} location={campaign.raiser.location} />

            {campaign.comments.length > 0 && (
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-[28px] font-normal leading-[1.14] tracking-[-0.01em] text-ink">
                    Comments
                  </h2>
                  <span className="rounded bg-panel px-2 py-0.5 text-sm text-heading">
                    {campaign.comments.length}
                  </span>
                </div>
                <p className="text-[16px] text-heading">Please sign in and donate to comment.</p>
                <div className="flex flex-col gap-6">
                  {campaign.comments.map((c) => (
                    <CommentItem key={c.id} comment={c} />
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <DonateSidebar campaign={campaign} />
          </aside>
        </div>
      </Container>
    </AppShell>
  );
}

function MobileDonateBar({ campaign }: { campaign: Campaign }) {
  const pct = campaign.goal
    ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))
    : null;
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-sm text-muted-ink">
          <span className="font-semibold text-ink">{formatCompactMoney(campaign.raised)}</span>{" "}
          raised{pct === null ? "" : ` · ${pct}%`}
        </p>
        {pct === null ? (
          <p className="text-[13px] text-muted-ink">{campaign.donors.toLocaleString()} givers</p>
        ) : null}
        {pct !== null ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
            <div className="h-1.5 rounded-full bg-[#FE5102]" style={{ width: `${pct}%` }} />
          </div>
        ) : null}
      </div>
      <ShareButton
        campaign={campaign}
        iconOnly
        className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line-soft bg-paper text-heading"
      />
      <Link
        to="/donate/$id"
        params={{ id: campaign.id }}
        search={{ freq: "" }}
        className="flex h-12 shrink-0 items-center justify-center rounded-lg bg-btn px-5 text-sm font-semibold text-btn-fg"
      >
        Donate now
      </Link>
    </div>
  );
}

function HeroSection({
  campaign,
  org,
}: {
  campaign: Campaign;
  org: { id: string; name: string } | null;
}) {
  const photos = campaign.gallery.length > 0 ? campaign.gallery : [campaign.cover];
  const [index, setIndex] = useState(0);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-[clamp(32px,3.2vw,48px)] font-normal leading-[1.08] tracking-[-0.01em] text-ink">
        {campaign.title}
      </h1>

      <div className="relative -mx-6 aspect-[4/3] w-[calc(100%+48px)] overflow-hidden bg-muted sm:mx-0 sm:aspect-[16/9] sm:w-full sm:rounded-2xl">
        <Photo
          key={photos[index]}
          src={photos[index]}
          loading="eager"
          className="absolute inset-0"
        />
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white sm:h-8 sm:w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setIndex((i) => (i + 1) % photos.length)}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white sm:h-8 sm:w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] text-heading">
        <img src={campaign.raiser.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
        <span className="font-medium">{campaign.raiser.name}</span>
        <span className="w-full pl-8 text-muted-ink sm:w-auto sm:pl-0">
          <span className="hidden sm:inline">· </span>
          {campaign.location}
        </span>
        {org && (
          <Link to="/org/$id" params={{ id: org.id }} className="text-[#fe5102] underline">
            Part of {org.name}
          </Link>
        )}
      </div>

      <p className="whitespace-pre-line text-[16px] leading-[24px] text-heading">
        {campaign.story}
      </p>

      <div className="hidden gap-3 lg:flex">
        <ShareButton
          campaign={campaign}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line-soft bg-paper px-4 py-3 text-sm font-semibold text-heading hover:bg-muted"
        />
        <Link
          to="/donate/$id"
          params={{ id: campaign.id }}
          search={{ freq: "" }}
          className="flex flex-1 items-center justify-center rounded-lg bg-btn px-4 py-3 text-sm font-semibold text-btn-fg transition-opacity hover:opacity-90"
        >
          Donate now
        </Link>
      </div>
    </section>
  );
}

function UpdateItem({
  update,
  isLatest,
}: {
  update: Campaign["updates"][number];
  isLatest: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[16px] font-medium text-heading">{update.date}</span>
        {isLatest && (
          <span className="rounded bg-[#ccf88e] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#274a34]">
            New
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-heading">{update.title}</p>
      <p className="text-[16px] leading-[24px] text-heading">{update.body}</p>
    </div>
  );
}

function ShareSection({ campaign }: { campaign: Campaign }) {
  const icons = [
    { icon: Link2, label: "Copy link" },
    { icon: Facebook, label: "Share on Facebook" },
    { icon: MessageCircle, label: "Share on WhatsApp" },
    { icon: Send, label: "Share via Messenger" },
    { icon: Linkedin, label: "Share on LinkedIn" },
  ];
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-[28px] font-normal leading-[1.14] tracking-[-0.01em] text-ink">
        Sharing helps more than you think
      </h2>
      <p className="text-[16px] text-heading">
        Sharing this campaign with your network can help {campaign.raiser.name.split(" ")[0]} reach
        more people and raise support faster.
      </p>
      <div className="flex gap-3">
        {icons.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => shareAction(label, campaign)}
            className="grid h-10 w-10 place-items-center rounded-full bg-panel text-ink-soft hover:bg-panel"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </section>
  );
}

function shareAction(label: string, campaign: Campaign) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  if (label === "Copy link") {
    navigator.clipboard?.writeText(url);
    toast("Link copied");
    return;
  }
  const text = encodeURIComponent(campaign.title);
  const encodedUrl = encodeURIComponent(url);
  const shareUrls: Record<string, string> = {
    "Share on Facebook": `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    "Share on WhatsApp": `https://wa.me/?text=${text}%20${encodedUrl}`,
    "Share via Messenger": `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=0`,
    "Share on LinkedIn": `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
  const target = shareUrls[label];
  if (target) window.open(target, "_blank", "noopener,noreferrer");
}

function ShareButton({
  campaign,
  className,
  iconOnly = false,
}: {
  campaign: Campaign;
  className: string;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => shareAction("Copy link", campaign)}
      aria-label={iconOnly ? "Share campaign" : undefined}
      className={className}
    >
      {iconOnly ? <Link2 className="h-5 w-5" strokeWidth={1.5} /> : "Share"}
    </button>
  );
}

function OrganiserSection({ name, location }: { name: string; location: string }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-[28px] font-normal leading-[1.14] tracking-[-0.01em] text-ink">
        Organiser
      </h2>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-panel text-sm font-semibold text-muted-ink">
            {name.charAt(0)}
          </div>
          <div>
            <p className="text-[16px] font-medium text-heading">{name}</p>
            <p className="text-sm text-muted-ink">Organiser · {location}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => toast("Messaging is coming soon")}
          className="shrink-0 rounded-full border border-line-input px-4 py-2 text-sm font-semibold text-heading hover:bg-muted"
        >
          Message
        </button>
      </div>
    </section>
  );
}

function CommentItem({ comment }: { comment: Campaign["comments"][number] }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="flex gap-3">
      <img src={comment.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-medium text-heading">{comment.author}</span>
          <span className="text-sm text-muted-ink">{comment.date}</span>
        </div>
        <p className="text-[16px] leading-[24px] text-heading">{comment.body}</p>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className={`flex w-fit items-center gap-1.5 text-sm ${liked ? "text-[#fe5102]" : "text-muted-ink"}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-[#fe5102]" : ""}`} />
          {liked ? "Liked" : "Like"}
        </button>
      </div>
    </div>
  );
}

function DonateSidebar({ campaign }: { campaign: Campaign }) {
  const [seeAll, setSeeAll] = useState(false);
  const [sortTop, setSortTop] = useState(false);
  const pct = campaign.goal
    ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))
    : null;

  const donations = [...campaign.donations].sort((a, b) => (sortTop ? b.amount - a.amount : 0));
  const visibleDonations = seeAll ? donations : donations.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-line-soft p-6">
      <div className="flex items-center gap-4">
        {pct !== null && <ProgressRing percent={pct} />}
        <div>
          <p className="text-2xl text-heading">
            {formatMoney(campaign.raised)}
            {campaign.goal && (
              <span className="text-muted-ink"> of {formatMoney(campaign.goal)}</span>
            )}
          </p>
          <p className="text-sm text-muted-ink">{campaign.donors.toLocaleString()} donations</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Link
          to="/donate/$id"
          params={{ id: campaign.id }}
          search={{ freq: "" }}
          className="flex items-center justify-center rounded-lg bg-btn px-4 py-3 text-sm font-semibold text-btn-fg transition-opacity hover:opacity-90"
        >
          Donate now
        </Link>
        <ShareButton
          campaign={campaign}
          className="flex items-center justify-center rounded-lg border border-line-soft bg-paper px-4 py-3 text-sm font-semibold text-heading hover:bg-muted"
        />
      </div>

      {campaign.donations.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-peach px-3 py-2.5">
          <TrendingUp className="h-4 w-4 shrink-0 text-[#fe5102]" />
          <span className="text-sm font-medium text-[#fe5102]">
            {campaign.donations.length} recent donations
          </span>
        </div>
      )}

      {donations.length > 0 && (
        <div className="flex flex-col gap-4">
          {visibleDonations.map((d) => (
            <DonorRow key={d.id} donation={d} />
          ))}
        </div>
      )}

      {donations.length > 0 && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSeeAll((v) => !v)}
            className="flex-1 rounded-md border border-line-input px-3 py-2 text-sm font-medium text-heading hover:bg-muted"
          >
            {seeAll ? "See less" : "See all"}
          </button>
          <button
            type="button"
            onClick={() => setSortTop((v) => !v)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium ${
              sortTop
                ? "border-[#fe5102] text-[#fe5102]"
                : "border-line-input text-heading hover:bg-muted"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${sortTop ? "fill-[#fe5102]" : ""}`} /> See top
          </button>
        </div>
      )}
    </div>
  );
}

function DonorRow({ donation }: { donation: Donation }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel text-sm font-semibold text-muted-ink">
        {donation.donor.charAt(0)}
      </div>
      <div>
        <p className="text-[16px] font-medium text-heading">{donation.donor}</p>
        <p className="text-sm text-muted-ink">
          {formatMoney(donation.amount)} · {donation.note ?? donation.date}
        </p>
      </div>
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ebecec"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fe5102"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-heading">
        {percent}%
      </span>
    </div>
  );
}
