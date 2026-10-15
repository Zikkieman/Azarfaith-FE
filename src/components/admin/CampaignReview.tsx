import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatMoney, type Campaign } from "@/lib/domain";
import { rejectReasons, timeAgo } from "@/lib/admin";
import { btn } from "@/components/app/btn";
import { Segments } from "@/components/app/Segments";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { AdminRejectDialog } from "./AdminRejectDialog";
import { StatusBadge, UrgencyBadge } from "./AdminBadge";
import { campaignChecks, type AutoCheck } from "./useAdmin";
import { apiFetch } from "@/lib/api";
import { ReviewChecklist } from "./LiveReviewRecords";

/** The automatic checks as a list: green tick, or an amber flag with what to ask for. */
export function AutoCheckList({ checks }: { checks: AutoCheck[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line-soft rounded-field border border-line-soft">
      {checks.map((c) => (
        <li key={c.label} className="flex items-start gap-3 p-4">
          <span
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-full",
              c.ok
                ? "bg-verified text-white"
                : c.blocking
                  ? "bg-danger text-white"
                  : "bg-brand/15 text-brand-ink",
            )}
          >
            {c.ok ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : c.blocking ? (
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{c.label}</p>
            <p className={cn("text-[13px]", c.ok ? "text-muted-ink" : "text-ink-soft")}>
              {c.detail}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Approve / reject for one campaign. Approve waits for a verified organizer and says so. */
export function CampaignActions({
  campaign,
  size = "md",
}: {
  campaign: Campaign;
  size?: "sm" | "md";
}) {
  const queryClient = useQueryClient();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const reviewable =
    campaign.verificationStatus === "pending" || campaign.verificationStatus === "unverified";
  const s = size === "sm" ? "sm" : "md";
  const decision = useMutation({
    mutationFn: (body: {
      status: "VERIFIED" | "UNVERIFIED";
      reviewAction: "APPROVED" | "REJECTED";
      reason?: string;
    }) =>
      apiFetch(`/admin/review/campaigns/${campaign.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "campaign", campaign.id] }),
      ]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update this campaign."),
  });

  if (!reviewable) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn("secondary", s)} onClick={() => setRejecting(true)}>
          Reject
        </button>
        <button
          type="button"
          disabled={decision.isPending}
          className={btn("primary", s)}
          onClick={() => setApproving(true)}
        >
          Approve
        </button>
      </div>
      <AdminConfirmDialog
        open={approving}
        onOpenChange={setApproving}
        title="Approve this campaign?"
        description={campaign.title}
        consequences={[
          "It goes live in Discover and on the giving map.",
          "Givers can start giving straight away.",
          `${campaign.raiser.name} gets an email to say it's live.`,
        ]}
        confirmLabel="Approve and publish"
        onConfirm={() =>
          decision.mutate(
            { status: "VERIFIED", reviewAction: "APPROVED" },
            {
              onSuccess: () => {
                setApproving(false);
                toast.success("Campaign approved and live");
              },
            },
          )
        }
      />
      <AdminRejectDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title="Reject this campaign?"
        description="The organizer can fix it and submit again."
        reasons={rejectReasons.campaign}
        onReject={(reason, notify) =>
          decision.mutate(
            { status: "UNVERIFIED", reviewAction: "REJECTED", reason },
            {
              onSuccess: () => {
                setRejecting(false);
                toast(`Campaign rejected${notify ? ". We've emailed the organizer" : ""}`);
              },
            },
          )
        }
      />
    </>
  );
}

/** Row click on the campaigns list opens this side panel. */
export function CampaignPanel({
  campaign,
  onClose,
}: {
  campaign: Campaign | null;
  onClose: () => void;
}) {
  const details = useQuery({
    queryKey: ["admin", "campaign", campaign?.id],
    queryFn: () =>
      apiFetch<{
        organization: {
          id: string;
          name: string;
          verificationStatus: Campaign["verificationStatus"];
        } | null;
      }>(`/admin/review/campaigns/${campaign!.id}`),
    enabled: Boolean(campaign),
  });
  const org = details.data?.organization;
  const pct = campaign?.goal
    ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))
    : null;

  return (
    <Sheet open={Boolean(campaign)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-l border-line-soft p-0 font-gsf sm:max-w-[520px] [&>button]:hidden"
      >
        {campaign ? (
          <>
            <div className="flex items-start gap-3 border-b border-line-soft px-5 py-4">
              <div className="min-w-0 flex-1">
                <SheetTitle className="font-display text-[19px] font-normal leading-tight text-ink">
                  {campaign.title}
                </SheetTitle>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-ink">
                  <StatusBadge status={campaign.verificationStatus} />
                  <UrgencyBadge urgency={campaign.urgency} />
                  <span>Submitted {timeAgo(campaign.createdAt)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-muted-ink transition-colors hover:bg-panel hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-5">
                <img
                  src={campaign.cover}
                  alt=""
                  className="aspect-[16/9] w-full rounded-field object-cover"
                />
                <section className="flex flex-col gap-2.5">
                  <h3 className="text-[13px] font-medium text-subtle">Checks</h3>
                  {details.isLoading ? (
                    <p className="rounded-field border border-line-soft px-4 py-5 text-sm text-muted-ink">
                      Loading checks...
                    </p>
                  ) : (
                    <ReviewChecklist entityType="campaign" id={campaign.id} />
                  )}
                </section>
                <section className="flex flex-col gap-1.5">
                  <h3 className="text-[13px] font-medium text-subtle">Story</h3>
                  <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-[1.65] text-ink-soft">
                    {campaign.story}
                  </p>
                </section>
                <section className="flex flex-col gap-2">
                  <h3 className="text-[13px] font-medium text-subtle">Progress</h3>
                  <p className="text-sm text-ink-soft">
                    <span className="font-semibold text-ink">{formatMoney(campaign.raised)}</span>
                    {campaign.goal
                      ? ` of ${formatMoney(campaign.goal)}`
                      : " given so far"} from {campaign.donors.toLocaleString()} givers
                  </p>
                  {pct !== null ? <Segments pct={pct} /> : null}
                </section>
                <section className="flex items-center gap-3 rounded-field border border-line-soft p-3">
                  <img
                    src={campaign.raiser.avatar}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{campaign.raiser.name}</p>
                    <p className="text-[12px] text-muted-ink">
                      {org ? org.name : "Personal campaign"}, {campaign.location}
                    </p>
                  </div>
                  {org ? <StatusBadge status={org.verificationStatus} /> : null}
                </section>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3">
              <Link
                to="/admin/campaigns/$id"
                params={{ id: campaign.id }}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Open full record <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
              <CampaignActions campaign={campaign} size="sm" />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
