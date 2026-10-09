import { useApp } from "@/lib/store";
import type { Campaign, Org } from "@/lib/mock";
import { checkDefs, orgFiles, type AuditAction, type CheckKey, type CheckState } from "@/lib/admin";

/** Summary used by lists, panels and the verify button: "2 of 4", and whether verify is allowed. */
export function useCheckSummary(orgId: string) {
  const checks = useApp((s) => s.checks[orgId]);
  const keys = Object.keys(checks ?? {}) as CheckKey[];
  const passed = keys.filter((k) => checks[k] === "passed").length;
  const failed = keys.filter((k) => checks[k] === "failed");
  return {
    passed,
    total: keys.length,
    failed: failed.map((k) => checkDefs.find((d) => d.key === k)!),
    ready: keys.length > 0 && passed === keys.length,
  };
}

export const actionText: Record<AuditAction, string> = {
  org_registered: "registered",
  org_verified: "verified",
  org_rejected: "rejected",
  org_revoked: "revoked verification for",
  check_updated: "updated checks for",
  campaign_submitted: "submitted",
  campaign_approved: "approved",
  campaign_rejected: "rejected",
  user_suspended: "suspended",
  user_reactivated: "reactivated",
  role_changed: "changed the role of",
  settings_updated: "updated",
  giving_paused: "paused",
  giving_resumed: "resumed",
  note_added: "added a note to",
};

/** Things a reviewer should see before deciding, worked out from the file and the checks. */
export function orgRisks(org: Org, checks?: Record<CheckKey, CheckState>) {
  const file = orgFiles[org.id];
  const risks: string[] = [];
  if (file && file.accountName !== org.name)
    risks.push(`Payout account is in the name "${file.accountName}", not ${org.name}.`);
  if (file && file.documents.length === 0) risks.push("No registration documents uploaded.");
  if (file && file.rcNumber === "Not provided") risks.push("No CAC registration number given.");
  if (checks?.leadership === "failed") risks.push("We couldn't reach the leaders listed.");
  return risks;
}

export type AutoCheck = { label: string; ok: boolean; detail: string; blocking?: boolean };

/** Checks a reviewer runs on every campaign, worked out from the campaign itself. */
export function campaignChecks(c: Campaign, org?: Org): AutoCheck[] {
  return [
    org
      ? {
          label: "Organizer is verified",
          ok: org.verificationStatus === "verified",
          detail:
            org.verificationStatus === "verified"
              ? `${org.name} is a verified organization.`
              : `${org.name} isn't verified yet. Verify the organization first.`,
          blocking: true,
        }
      : {
          label: "Organizer is verified",
          ok: true,
          detail: "Personal campaign. The organizer's phone number is confirmed.",
        },
    {
      label: "Real photos of the work",
      ok: c.gallery.length > 0,
      detail: c.gallery.length
        ? `${c.gallery.length + 1} photos, including the cover.`
        : "Only a cover photo. Ask for photos of the people or place.",
    },
    {
      label: "Story explains the need",
      ok: c.story.length >= 160,
      detail:
        c.story.length >= 160
          ? "Says who it's for, what's needed and why."
          : "The story is short. Givers need to know what the money is for.",
    },
    {
      label: "Goal fits the story",
      ok: !c.goal || c.goal <= 25_000_000,
      detail: c.goal
        ? `Asking for ₦${c.goal.toLocaleString()}.`
        : "Ongoing support, no fixed goal.",
    },
  ];
}
