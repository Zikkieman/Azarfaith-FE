import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Link2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { CauseLightbox } from "@/components/app/CauseLightbox";
import { Photo } from "@/components/app/Photo";
import { Segments } from "@/components/app/Segments";
import { GiveBox } from "@/components/app/GiveBox";
import {
  AppShell,
  BackLink,
  Container,
  SectionHeading,
  Tag,
  VerifiedBadge,
  cardClass,
  pageTitleClass,
  smallHeadingClass,
} from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { getOrganization } from "@/features/catalog/api";
import { apiFetch } from "@/lib/api";
import { activityDate, isPublished } from "@/lib/discovery";
import { dashboardCompactMoney as formatCompactMoney } from "@/lib/dashboard";
import { shareCause } from "@/lib/share-cause";
import { UserAvatar } from "@/components/UserAvatar";
import { CommentLikes, type CommentReaction } from "./CommentLikes";
import { formatMoney, type Campaign } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const percent = (c: Campaign) =>
  c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : null;

export function CampaignPublicView({
  campaign,
  authenticated,
  isOwner,
  onManage,
  commentBody,
  onCommentChange,
  onComment,
  commenting,
}: {
  campaign: Campaign;
  authenticated: boolean;
  isOwner: boolean;
  onManage: () => void;
  commentBody: string;
  onCommentChange: (value: string) => void;
  onComment: () => void;
  commenting: boolean;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const [allUpdates, setAllUpdates] = useState(false);
  const published = isPublished(campaign);
  const organization = useQuery({
    queryKey: ["organization", campaign.orgId, user?.id ?? "guest"],
    queryFn: () => getOrganization(campaign.orgId!),
    enabled: Boolean(campaign.orgId),
    retry: false,
  });
  const org = organization.data;
  const reactions = useQuery({
    queryKey: [
      "comment-reactions",
      campaign.id,
      user?.id ?? "guest",
      campaign.comments.map((c) => c.id).join(","),
    ],
    queryFn: () =>
      apiFetch<CommentReaction[]>(
        `/campaigns/${encodeURIComponent(campaign.id)}/comments/reactions`,
      ),
    enabled: published && campaign.comments.length > 0,
  });
  const orderedUpdates = [...campaign.updates].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
  const updates = allUpdates ? orderedUpdates : orderedUpdates.slice(0, 2);
  return (
    <AppShell bottomBar={published ? <MobileGiveBar campaign={campaign} /> : undefined}>
      <Container className="py-8 md:py-12">
        <BackLink to="/discover">Back</BackLink>
        {isOwner && (
          <button
            type="button"
            className={cn(btn("secondary", "sm"), "float-right")}
            onClick={onManage}
          >
            Manage campaign
          </button>
        )}
        {!published && (
          <p role="status" className="mt-5 rounded-field bg-panel p-4 text-sm text-ink-soft">
            Campaign preview. This campaign is not available to donors yet.{" "}
            {campaign.reviewReason || "It will go live after approval."}
          </p>
        )}

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
          <div className="flex min-w-0 flex-col gap-12">
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-soft">
                  <UserAvatar
                    src={campaign.raiser.avatar}
                    name={campaign.raiser.name}
                    className="h-6 w-6 bg-panel text-xs text-ink-soft"
                  />
                  {org?.name !== campaign.raiser.name ? (
                    <span className="font-medium text-heading">{campaign.raiser.name}</span>
                  ) : null}
                  {org ? (
                    <>
                      {org.name !== campaign.raiser.name ? <span>for</span> : null}
                      <Link
                        to="/org/$id"
                        params={{ id: org.id }}
                        className="font-medium text-heading underline underline-offset-2"
                      >
                        {org.name}
                      </Link>
                      {isPublished(org) ? <VerifiedBadge label={null} /> : null}
                    </>
                  ) : null}
                </p>
                <h1 className={pageTitleClass}>{campaign.title}</h1>
                <p className="flex flex-wrap items-center gap-3 text-sm text-muted-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" strokeWidth={1.5} /> {campaign.location}
                  </span>
                  <Tag>{campaign.faithCategory}</Tag>
                  {campaign.urgency === "critical" || campaign.type === "emergency" ? (
                    <Tag tone="brand">Urgent</Tag>
                  ) : null}
                </p>
              </div>

              <Gallery campaign={campaign} />

              <p className="max-w-[720px] whitespace-pre-line text-[17px] leading-[1.65] text-heading">
                {campaign.story}
              </p>
              {campaign.needs?.length ? (
                <ul className="list-disc space-y-2 pl-5 text-[15px] text-ink-soft">
                  {campaign.needs.map((need, i) => (
                    <li key={i}>{need}</li>
                  ))}
                </ul>
              ) : null}
              {authenticated && (campaign.viewerDonationTotal ?? 0) > 0 && (
                <p className="rounded-field bg-panel p-4 text-sm text-ink-soft">
                  You've given {formatMoney(campaign.viewerDonationTotal!)} to this campaign. Thank
                  you for your support.
                </p>
              )}
            </section>

            <section id="give" className="scroll-mt-20 lg:hidden">
              <GivePanel campaign={campaign} />
            </section>

            {campaign.updates.length > 0 ? (
              <section className="flex flex-col gap-6">
                <SectionHeading
                  aside={<span className="text-sm text-muted-ink">{campaign.updates.length}</span>}
                >
                  Updates
                </SectionHeading>
                <ol className="flex flex-col border-t border-line-soft">
                  {updates.map((u, i) => (
                    <li key={u.id} className="flex flex-col gap-1.5 border-b border-line-soft py-5">
                      <p className="flex items-center gap-2 text-[13px] text-muted-ink">
                        {activityDate(u)}
                        {i === 0 ? <Tag tone="verified">Latest</Tag> : null}
                      </p>
                      <p className={smallHeadingClass}>{u.title}</p>
                      <p className="max-w-[720px] text-[15px] leading-[1.6] text-ink-soft">
                        {u.body}
                      </p>
                    </li>
                  ))}
                </ol>
                {campaign.updates.length > 2 && !allUpdates ? (
                  <button
                    type="button"
                    onClick={() => setAllUpdates(true)}
                    className={cn(btn("secondary", "sm"), "self-start")}
                  >
                    Show {campaign.updates.length - 2} more
                  </button>
                ) : null}
              </section>
            ) : null}

            <section className="flex flex-col gap-5">
              <SectionHeading>Organiser</SectionHeading>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={campaign.raiser.avatar}
                    name={campaign.raiser.name}
                    className="h-11 w-11 bg-panel text-sm text-ink-soft"
                  />
                  <div>
                    <p className="text-[15px] font-semibold text-heading">{campaign.raiser.name}</p>
                    <p className="text-sm text-muted-ink">{campaign.raiser.location}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast("Messaging is coming soon")}
                  className={btn("secondary", "sm")}
                >
                  Message
                </button>
              </div>
            </section>

            {published || campaign.comments.length > 0 ? (
              <section className="flex flex-col gap-5" aria-label="Campaign comments">
                <SectionHeading
                  aside={<span className="text-sm text-muted-ink">{campaign.comments.length}</span>}
                >
                  Words of encouragement
                </SectionHeading>
                <p className="text-sm text-muted-ink">Givers can leave a message when they give.</p>
                {authenticated && published ? (
                  <form
                    className={cn(cardClass, "flex flex-col gap-3 p-5")}
                    onSubmit={(e) => {
                      e.preventDefault();
                      onComment();
                    }}
                  >
                    <label htmlFor="campaign-comment" className="text-sm font-medium text-ink">
                      Add a comment
                    </label>
                    <textarea
                      id="campaign-comment"
                      rows={3}
                      maxLength={1000}
                      className="w-full rounded-field border border-line-input bg-paper px-3.5 py-3 text-[15px] text-ink focus:border-ink focus:outline-none"
                      value={commentBody}
                      onChange={(e) => onCommentChange(e.target.value)}
                      placeholder="Share encouragement or ask a thoughtful question."
                    />
                    <button
                      type="submit"
                      disabled={commenting || commentBody.trim().length < 2}
                      className={cn(btn("primary", "sm"), "self-end")}
                    >
                      {commenting ? "Posting..." : "Post comment"}
                    </button>
                  </form>
                ) : published ? (
                  <p className="text-sm text-muted-ink">
                    <Link
                      to="/login"
                      search={{ returnTo: "/campaign/" + encodeURIComponent(campaign.id) }}
                      className="underline"
                    >
                      Log in
                    </Link>{" "}
                    to leave a comment.
                  </p>
                ) : null}
                {reactions.isError && (
                  <p role="alert" className="text-sm text-muted-ink">
                    Comment likes could not load.{" "}
                    <button className="underline" onClick={() => void reactions.refetch()}>
                      Retry
                    </button>
                  </p>
                )}
                <div className="flex flex-col gap-6">
                  {[...campaign.comments]
                    .sort(
                      (a, b) =>
                        Date.parse(a.createdAt ?? a.date) - Date.parse(b.createdAt ?? b.date),
                    )
                    .map((c) => (
                      <CommentItem
                        key={c.id}
                        comment={c}
                        campaignId={campaign.id}
                        authenticated={authenticated && published}
                        reaction={reactions.data?.find((r) => r.id === c.id)}
                      />
                    ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <GivePanel campaign={campaign} />
          </aside>
        </div>
      </Container>
    </AppShell>
  );
}

function Gallery({ campaign }: { campaign: Campaign }) {
  const photos = campaign.gallery.length > 0 ? campaign.gallery : [campaign.cover];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const step = (d: number) => setIndex((i) => (i + d + photos.length) % photos.length);
  return (
    <div className="relative -mx-6 aspect-[4/3] overflow-hidden bg-panel sm:mx-0 sm:aspect-[16/9] sm:rounded-card">
      <Photo key={photos[index]} src={photos[index]} loading="eager" className="absolute inset-0" />
      <button
        type="button"
        aria-label="Enlarge photo"
        className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-ink"
        onClick={() => setOpen(true)}
      />
      <CauseLightbox
        photos={photos}
        index={index}
        onIndex={setIndex}
        title={campaign.title}
        open={open}
        onOpenChange={setOpen}
      />
      {photos.length > 1 ? (
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <span className="rounded-full bg-paper/90 px-2.5 py-1 text-xs font-medium text-ink">
            {index + 1} / {photos.length}
          </span>
          {[
            { d: -1, label: "Previous photo", Icon: ChevronLeft },
            { d: 1, label: "Next photo", Icon: ChevronRight },
          ].map(({ d, label, Icon }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={() => step(d)}
              className="grid h-9 w-9 place-items-center rounded-full bg-paper/90 text-ink transition-colors hover:bg-paper"
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Progress, then give right here (after Buy Me a Coffee), then who has given and what they said. */
function GivePanel({ campaign }: { campaign: Campaign }) {
  const pct = percent(campaign);
  return (
    <div className="flex flex-col gap-4">
      <div className={cn(cardClass, "flex flex-col gap-5 p-5 sm:p-6")}>
        <div className="flex flex-col gap-2.5">
          <p className="font-display text-[32px] leading-none tracking-[-0.03em] text-ink">
            {formatMoney(campaign.raised)}
          </p>
          <p className="text-sm text-muted-ink">
            {campaign.goal
              ? `raised of ${formatMoney(campaign.goal)} from ${campaign.donors.toLocaleString()} givers`
              : `given by ${campaign.donors.toLocaleString()} regular and one-off givers`}
          </p>
          {pct !== null ? <Segments pct={pct} /> : null}
        </div>
        <div className="border-t border-line-soft pt-5">
          <GiveBox campaign={campaign} />
        </div>
        <button
          type="button"
          onClick={() => void shareCause("campaign", campaign.id, campaign.title)}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <Link2 className="h-4 w-4" strokeWidth={1.75} /> Share this campaign
        </button>
      </div>
      <RecentGivers campaign={campaign} />
    </div>
  );
}

/** Recent givers, with their messages shown as notes (after Buy Me a Coffee's supporters). */
function RecentGivers({ campaign }: { campaign: Campaign }) {
  const [all, setAll] = useState(false);
  if (campaign.donations.length === 0) {
    return (
      <p className={cn(cardClass, "p-5 text-center text-sm text-muted-ink")}>
        No gifts yet. Be the first to give.
      </p>
    );
  }
  const gifts = all ? campaign.donations : campaign.donations.slice(0, 4);
  return (
    <div className={cn(cardClass, "flex flex-col gap-4 p-5 sm:p-6")}>
      <p className={smallHeadingClass}>Recent givers</p>
      <ul className="flex flex-col gap-4">
        {gifts.map((d) => (
          <li key={d.id} className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-sm font-semibold text-ink-soft">
              {d.donor.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-soft">
                <span className="font-medium text-ink">{d.donor}</span> gave {formatMoney(d.amount)}
                <span className="text-subtle">, {activityDate(d)}</span>
              </p>
              {d.note ? (
                <p className="mt-1.5 rounded-[12px] rounded-tl-[4px] bg-panel px-3 py-2 text-sm leading-[1.5] text-ink">
                  {d.note}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {campaign.donations.length > 4 ? (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className={cn(btn("quiet", "sm"), "-ml-4 self-start")}
        >
          {all ? "Show fewer" : `See all ${campaign.donations.length}`}
        </button>
      ) : null}
    </div>
  );
}

function MobileGiveBar({ campaign }: { campaign: Campaign }) {
  const pct = percent(campaign);
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-sm text-muted-ink">
          <span className="font-semibold text-ink">{formatCompactMoney(campaign.raised)}</span>{" "}
          {pct === null ? `from ${campaign.donors.toLocaleString()} givers` : `raised, ${pct}%`}
        </p>
        {pct !== null ? <Segments pct={pct} count={14} /> : null}
      </div>
      <button
        type="button"
        onClick={() => void shareCause("campaign", campaign.id, campaign.title)}
        aria-label="Share campaign"
        className="press grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-input text-ink"
      >
        <Link2 className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={() => document.getElementById("give")?.scrollIntoView({ behavior: "smooth" })}
        className={btn("primary")}
      >
        Give now
      </button>
    </div>
  );
}

function CommentItem({
  comment,
  campaignId,
  authenticated,
  reaction,
}: {
  comment: Campaign["comments"][number];
  campaignId: string;
  authenticated: boolean;
  reaction?: CommentReaction;
}) {
  return (
    <div className="flex gap-3">
      <UserAvatar
        src={comment.avatar}
        name={comment.author}
        className="h-10 w-10 bg-panel text-sm text-ink-soft"
      />
      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-heading">{comment.author}</span>
          <span className="text-[13px] text-muted-ink">{activityDate(comment)}</span>
        </p>
        <p className="whitespace-pre-wrap text-[15px] leading-[1.6] text-ink-soft">
          {comment.body}
        </p>
        <CommentLikes
          campaignId={campaignId}
          commentId={comment.id}
          authenticated={authenticated}
          state={reaction}
          designer
        />
      </div>
    </div>
  );
}
