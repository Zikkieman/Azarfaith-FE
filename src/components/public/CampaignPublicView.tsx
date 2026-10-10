import { Link } from "@tanstack/react-router";
import { MapPin, MessageSquare, Repeat2 } from "lucide-react";
import { formatMoney, type Campaign } from "@/lib/catalog";
import { activityDate, isPublished } from "@/lib/discovery";
import { PublicShell } from "./PublicShell";
import { PhotoGallery } from "./PhotoGallery";
import { GiveBox } from "./GiveBox";
import { VerifiedBadge } from "./CatalogCards";
import { ShareCause } from "./ShareCause";

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
  const published = isPublished(campaign);
  return (
    <PublicShell>
      <Link to="/discover" className="text-sm text-muted-foreground">
        ← Back to discover
      </Link>
      {!published && (
        <div role="status" className="mt-5 rounded-xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Campaign preview</strong>
          <p className="mt-1">
            This campaign isn't available to donors yet.
            {campaign.reviewReason
              ? ` ${campaign.reviewReason}`
              : " It will go live after approval."}
          </p>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {published && <VerifiedBadge />}
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-700">
            {campaign.faithCategory}
          </span>
          {campaign.mode === "ongoing" && (
            <span className="inline-flex items-center gap-1 text-xs">
              <Repeat2 className="h-3 w-3" /> Ongoing support
            </span>
          )}
          {["high", "critical"].includes(campaign.urgency) && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">Urgent</span>
          )}
        </div>
        {isOwner && (
          <button className="public-button-outline" onClick={onManage}>
            Manage campaign
          </button>
        )}
      </div>
      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
        <div className="min-w-0">
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {campaign.title}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>Organized by {campaign.raiser.name}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {campaign.location}
            </span>
            {campaign.orgId && (
              <Link
                className="text-orange-600 underline-offset-4 hover:underline"
                to="/org/$id"
                params={{ id: campaign.orgId }}
              >
                View organization
              </Link>
            )}
          </p>
          <div className="mt-7">
            <PhotoGallery photos={[campaign.cover, ...campaign.gallery]} title={campaign.title} />
          </div>
          {published && (
            <a
              href={`#give-${campaign.id}`}
              className="public-button mt-5 w-full justify-center lg:hidden"
            >
              Choose your gift
            </a>
          )}
          <section className="mt-9 border-b border-stone-100 pb-9">
            <h2 className="text-xl font-semibold">The story</h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
              {campaign.story}
            </p>
            {campaign.needs?.length ? (
              <>
                <h3 className="mt-5 font-medium">How you can help</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {campaign.needs.map((need, i) => (
                    <li key={`${need}-${i}`}>{need}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {authenticated && (campaign.viewerDonationTotal ?? 0) > 0 && (
              <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                You've given {formatMoney(campaign.viewerDonationTotal ?? 0)} to this campaign.
                Thank you for your support.
              </p>
            )}
          </section>
          <section className="mt-9" aria-label="Campaign comments">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <MessageSquare className="h-5 w-5 text-orange-500" /> Comments{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({campaign.comments.length})
              </span>
            </h2>
            {authenticated && published ? (
              <form
                className="public-panel mt-5 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  onComment();
                }}
              >
                <label className="text-sm font-medium" htmlFor="campaign-comment">
                  Add a comment
                </label>
                <textarea
                  id="campaign-comment"
                  className="public-input mt-3 min-h-28 resize-y"
                  maxLength={1000}
                  value={commentBody}
                  onChange={(event) => onCommentChange(event.target.value)}
                  placeholder="Share encouragement or ask a thoughtful question."
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Up to 1,000 characters</span>
                  <button
                    type="submit"
                    disabled={commenting || commentBody.trim().length < 2}
                    className="public-button disabled:opacity-50"
                  >
                    {commenting ? "Posting..." : "Post comment"}
                  </button>
                </div>
              </form>
            ) : !authenticated && published ? (
              <p className="mt-5 text-sm text-muted-foreground">
                <Link to="/login" className="text-orange-600 underline">
                  Log in
                </Link>{" "}
                to leave a comment.
              </p>
            ) : null}
            <div className="mt-5 space-y-5">
              {[...campaign.comments]
                .sort(
                  (a, b) => Date.parse(a.createdAt ?? a.date) - Date.parse(b.createdAt ?? b.date),
                )
                .map((comment) => (
                  <article key={comment.id} className="border-b border-stone-100 pb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{comment.author}</strong>
                      <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
                        {activityDate(comment)}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {comment.body}
                    </p>
                  </article>
                ))}
            </div>
          </section>
          <section className="mt-9">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Campaign updates</h2>
              {isOwner && (
                <button onClick={onManage} className="text-sm text-orange-600">
                  Post an update
                </button>
              )}
            </div>
            {campaign.updates.length ? (
              <div className="mt-5 space-y-5">
                {campaign.updates.map((update) => (
                  <article key={update.id} className="public-panel p-5">
                    <time dateTime={update.date} className="text-xs text-muted-foreground">
                      {new Date(update.date).toLocaleDateString()}
                    </time>
                    <h3 className="mt-2 font-semibold">{update.title}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {update.body}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No updates yet. Check back to see how this work is progressing.
              </p>
            )}
          </section>
        </div>
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
          <GiveBox campaign={campaign} authenticated={authenticated} />
          <section className="public-panel p-6">
            <h2 className="font-semibold">Share this cause</h2>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Help this work reach more people.
            </p>
            <ShareCause path={`/campaign/${campaign.id}`} title={campaign.title} />
          </section>
          <section className="public-panel p-6">
            <h2 className="font-semibold">Recent giving</h2>
            {campaign.donations.length ? (
              <ul className="mt-5 space-y-5">
                {campaign.donations.map((donation) => (
                  <li key={donation.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{donation.donor}</p>
                      <time
                        dateTime={donation.createdAt}
                        className="mt-1 block text-xs text-muted-foreground"
                      >
                        {activityDate(donation)}
                      </time>
                    </div>
                    <strong className="shrink-0">{formatMoney(donation.amount)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Be the first to support this cause.
              </p>
            )}
          </section>
        </aside>
      </div>
    </PublicShell>
  );
}
