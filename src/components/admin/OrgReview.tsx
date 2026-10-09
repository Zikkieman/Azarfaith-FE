import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Church,
  Landmark,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney, type Org } from "@/lib/mock";
import { orgFiles, rejectReasons, timeAgo } from "@/lib/admin";
import { btn } from "@/components/app/btn";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { AdminRejectDialog } from "./AdminRejectDialog";
import { StatusBadge } from "./AdminBadge";
import { CheckList, DocumentList, Field, FieldGroup, RiskSignals } from "./AdminParts";
import { orgCategoryLabel } from "./labels";
import { orgRisks, useCheckSummary } from "./useAdmin";

/**
 * Verify / reject / revoke for one organization, with the dialogs. Verify stays disabled until
 * every check has passed and says what's missing (the Buildkite "why can't I" pattern).
 */
export function OrgActions({ org, size = "md" }: { org: Org; size?: "sm" | "md" }) {
  const verifyOrg = useApp((s) => s.verifyOrg);
  const live = useApp(
    (s) =>
      s.campaigns.filter((c) => c.orgId === org.id && c.verificationStatus === "verified").length,
  );
  const { ready, passed, total, failed } = useCheckSummary(org.id);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const file = orgFiles[org.id];
  const reviewable =
    org.verificationStatus === "pending" || org.verificationStatus === "unverified";
  const verified = org.verificationStatus === "verified";
  const blocked = !ready
    ? failed.length
      ? `${failed[0].label} failed. Fix it or reject.`
      : `${total - passed} of ${total} checks still waiting.`
    : undefined;

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
              disabled={Boolean(blocked)}
              title={blocked}
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
      {reviewable && blocked && size === "md" ? (
        <p className="w-full text-right text-[12px] text-muted-ink sm:w-auto">{blocked}</p>
      ) : null}

      <AdminConfirmDialog
        open={verifying}
        onOpenChange={setVerifying}
        title={`Verify ${org.name}?`}
        consequences={[
          "Their profile and every campaign get the green verified tick.",
          "They can receive gifts and request payouts.",
          file
            ? `We email ${file.contactName} at ${file.email} to let them know.`
            : "We email them to let them know.",
        ]}
        confirmLabel="Verify organization"
        onConfirm={() => {
          verifyOrg(org.id, "verified");
          toast.success(`${org.name} is verified`);
        }}
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
        consequences={
          verified && live > 0
            ? [`${live} live campaign${live > 1 ? "s" : ""} will stop taking gifts.`]
            : undefined
        }
        onReject={(reason, notify) => {
          verifyOrg(org.id, "rejected", reason);
          toast(
            `${org.name} ${verified ? "is no longer verified" : "was rejected"}${notify ? ". We've emailed them the reason" : ""}`,
          );
        }}
      />
    </>
  );
}

/** Row click on the organizations list opens this (after Modash's profile side panel). */
export function OrgPanel({ org, onClose }: { org: Org | null; onClose: () => void }) {
  const checks = useApp((s) => (org ? s.checks[org.id] : undefined));
  const allCampaigns = useApp((s) => s.campaigns);
  const campaigns = org ? allCampaigns.filter((c) => c.orgId === org.id) : [];
  const file = org ? orgFiles[org.id] : undefined;

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
                  {file ? <span>Applied {timeAgo(file.submittedAt)}</span> : null}
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
                <RiskSignals items={orgRisks(org, checks)} />
                <section className="flex flex-col gap-2.5">
                  <h3 className="text-[13px] font-medium text-subtle">Checks</h3>
                  <CheckList orgId={org.id} />
                </section>
                {file ? (
                  <section className="flex flex-col gap-2.5">
                    <h3 className="text-[13px] font-medium text-subtle">Documents</h3>
                    <DocumentList documents={file.documents} />
                  </section>
                ) : null}
                <div className="-mx-1">
                  <FieldGroup title="Contact">
                    {file ? (
                      <>
                        <Field icon={User} label="Contact">
                          {file.contactName}
                        </Field>
                        <Field icon={Mail} label="Email" copy={file.email}>
                          {file.email}
                        </Field>
                        <Field icon={Phone} label="Phone" copy={file.phone}>
                          {file.phone}
                        </Field>
                      </>
                    ) : null}
                    <Field icon={MapPin} label="Location">
                      {org.location}
                    </Field>
                  </FieldGroup>
                  <FieldGroup title="Payout">
                    {file ? (
                      <>
                        <Field icon={Landmark} label="Bank">
                          {file.bank}
                        </Field>
                        <Field icon={User} label="Account name">
                          <span className={cn(file.accountName !== org.name && "text-danger")}>
                            {file.accountName}
                          </span>
                        </Field>
                        <Field icon={Landmark} label="Account">
                          •••• {file.accountEnding}
                        </Field>
                      </>
                    ) : null}
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
                    <Field icon={Landmark} label="Received">
                      {formatMoney(org.totalReceived)}
                    </Field>
                    <Field icon={Building2} label="Campaigns">
                      {campaigns.length}
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
