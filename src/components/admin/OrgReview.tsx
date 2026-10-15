import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Church,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney, type Org } from "@/lib/domain";
import { rejectReasons } from "@/lib/admin";
import { btn } from "@/components/app/btn";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { AdminRejectDialog } from "./AdminRejectDialog";
import { StatusBadge } from "./AdminBadge";
import { Field, FieldGroup } from "./AdminParts";
import { orgCategoryLabel } from "./labels";
import { apiFetch } from "@/lib/api";
import { ReviewChecklist, ReviewDocuments } from "./LiveReviewRecords";

/**
 * Verify / reject / revoke for one organization, with the dialogs. Verify stays disabled until
 * every check has passed and says what's missing (the Buildkite "why can't I" pattern).
 */
export function OrgActions({ org, size = "md" }: { org: Org; size?: "sm" | "md" }) {
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const reviewable =
    org.verificationStatus === "pending" || org.verificationStatus === "unverified";
  const verified = org.verificationStatus === "verified";
  const decision = useMutation({
    mutationFn: (body: {
      status: "VERIFIED" | "UNVERIFIED";
      reviewAction: "APPROVED" | "REJECTED";
      reason?: string;
    }) =>
      apiFetch(`/admin/review/organizations/${org.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "organization", org.id] }),
      ]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update this organization."),
  });

  if (!reviewable && !verified) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {reviewable ? (
          <>
            <button
              type="button"
              className={btn("secondary", size === "sm" ? "sm" : "md")}
              onClick={() => setRejecting(true)}
            >
              Reject
            </button>
            <button
              type="button"
              disabled={decision.isPending}
              className={btn("primary", size === "sm" ? "sm" : "md")}
              onClick={() => setVerifying(true)}
            >
              Verify
            </button>
          </>
        ) : (
          <button
            type="button"
            className={cn(
              btn("secondary", size === "sm" ? "sm" : "md"),
              "text-danger hover:border-danger",
            )}
            onClick={() => setRejecting(true)}
          >
            Revoke verification
          </button>
        )}
      </div>

      <AdminConfirmDialog
        open={verifying}
        onOpenChange={setVerifying}
        title={`Verify ${org.name}?`}
        consequences={[
          "Their profile and every campaign get the green verified tick.",
          "They can receive gifts and request payouts.",
          "We email the organization owner to let them know.",
        ]}
        confirmLabel="Verify organization"
        onConfirm={() =>
          decision.mutate(
            { status: "VERIFIED", reviewAction: "APPROVED" },
            {
              onSuccess: () => {
                setVerifying(false);
                toast.success(`${org.name} is verified`);
              },
            },
          )
        }
      />
      <AdminRejectDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={verified ? `Revoke ${org.name}'s verification?` : `Reject ${org.name}?`}
        description={
          verified
            ? "Their verified tick comes off and they stop receiving gifts until they're verified again."
            : "They can fix the problem and apply again after the waiting period in Settings."
        }
        reasons={rejectReasons.org}
        confirmLabel={verified ? "Revoke" : "Reject"}
        onReject={(reason, notify) =>
          decision.mutate(
            { status: "UNVERIFIED", reviewAction: "REJECTED", reason },
            {
              onSuccess: () => {
                setRejecting(false);
                toast(
                  `${org.name} ${verified ? "is no longer verified" : "was rejected"}${notify ? ". We've emailed them the reason" : ""}`,
                );
              },
            },
          )
        }
      />
    </>
  );
}

/** Row click on the organizations list opens this (after Modash's profile side panel). */
export function OrgPanel({ org, onClose }: { org: Org | null; onClose: () => void }) {
  const details = useQuery({
    queryKey: ["admin", "organization", org?.id],
    queryFn: () => apiFetch<OrgPanelDetail>(`/admin/review/organizations/${org!.id}`),
    enabled: Boolean(org),
  });
  const record = details.data;
  const documents = Array.isArray(record?.registrationDocuments)
    ? record.registrationDocuments
    : [];
  const campaignCount = Array.isArray(record?.campaigns)
    ? record.campaigns.length
    : Array.isArray(org?.campaignIds)
      ? org.campaignIds.length
      : 0;

  return (
    <Sheet open={Boolean(org)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-l border-line-soft p-0 font-gsf sm:max-w-[520px] [&>button]:hidden"
      >
        {org ? (
          <>
            <div className="flex items-start gap-3 border-b border-line-soft px-5 py-4">
              <img
                src={org.photos[0]}
                alt=""
                className="h-11 w-11 shrink-0 rounded-[10px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate font-display text-[19px] font-normal leading-tight text-ink">
                  {org.name}
                </SheetTitle>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-ink">
                  <StatusBadge status={org.verificationStatus} />
                  {record ? (
                    <span>
                      Applied{" "}
                      {new Date(record.submittedAt ?? record.createdAt).toLocaleDateString(
                        "en-NG",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </span>
                  ) : null}
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
                <section className="flex flex-col gap-2.5">
                  <h3 className="text-[13px] font-medium text-subtle">Checks</h3>
                  {details.isLoading ? (
                    <p className="rounded-field border border-line-soft px-4 py-5 text-sm text-muted-ink">
                      Loading checks...
                    </p>
                  ) : (
                    <ReviewChecklist entityType="organization" id={org.id} />
                  )}
                </section>
                {record ? (
                  <section className="flex flex-col gap-2.5">
                    <h3 className="text-[13px] font-medium text-subtle">Documents</h3>
                    <ReviewDocuments documents={documents} />
                  </section>
                ) : null}
                <div className="-mx-1">
                  <FieldGroup title="Contact">
                    {record ? (
                      <>
                        <Field icon={User} label="Contact">
                          {record.owner.fullName}
                        </Field>
                        <Field icon={Mail} label="Email" copy={record.owner.email}>
                          {record.owner.email}
                        </Field>
                        <Field icon={Phone} label="Phone" copy={record.owner.phone || undefined}>
                          {record.owner.phone || "—"}
                        </Field>
                      </>
                    ) : null}
                    <Field icon={MapPin} label="Location">
                      {org.location}
                    </Field>
                  </FieldGroup>
                  <FieldGroup title="Organization" defaultOpen={false}>
                    <Field icon={Building2} label="Category">
                      {orgCategoryLabel[org.category]}
                    </Field>
                    <Field icon={Church} label="Denomination">
                      {org.denomination}
                    </Field>
                    <Field icon={Calendar} label="Founded">
                      {org.founded}
                    </Field>
                    <Field icon={Building2} label="Received">
                      {formatMoney(org.totalReceived)}
                    </Field>
                    <Field icon={Building2} label="Campaigns">
                      {campaignCount}
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line-soft bg-paper px-5 py-3">
              <Link
                to="/admin/orgs/$id"
                params={{ id: org.id }}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Open full record <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
              <OrgActions org={org} size="sm" />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

type OrgPanelDetail = {
  createdAt: string;
  submittedAt: string | null;
  owner: { fullName: string; email: string; phone: string };
  registrationDocuments: string[];
  campaigns: Array<{ id: string }>;
};
