import { Tag } from "@/components/app/AppShell";
import type { UserRole, UserStatus } from "@/lib/mock";
import { roleLabel } from "./labels";

type Verification = "verified" | "pending" | "unverified" | "rejected";

const verification: Record<
  Verification,
  { tone: Parameters<typeof Tag>[0]["tone"]; label: string }
> = {
  verified: { tone: "verified", label: "Verified" },
  pending: { tone: "attention", label: "Pending review" },
  unverified: { tone: "neutral", label: "Unverified" },
  rejected: { tone: "danger", label: "Rejected" },
};

/** Verification state for organizations and campaigns, always worded, never colour alone. */
export function StatusBadge({ status }: { status: Verification }) {
  const v = verification[status];
  return <Tag tone={v.tone}>{v.label}</Tag>;
}

export function AccountBadge({ status }: { status: UserStatus }) {
  return status === "active" ? (
    <Tag tone="verified">Active</Tag>
  ) : (
    <Tag tone="danger">Suspended</Tag>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Tag>{roleLabel[role]}</Tag>;
}

const urgencyLabel = { low: "Low", medium: "Medium", high: "High", critical: "Critical" } as const;

/** Only high and critical urgency get colour; the rest read as plain text. */
export function UrgencyBadge({ urgency }: { urgency: keyof typeof urgencyLabel }) {
  if (urgency === "critical") return <Tag tone="danger">Critical</Tag>;
  if (urgency === "high") return <Tag tone="attention">High</Tag>;
  return <span className="text-sm text-muted-ink">{urgencyLabel[urgency]}</span>;
}
