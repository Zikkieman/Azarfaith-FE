/** Shared admin presentation types and utilities. Review data comes from the API. */

export type CheckState = "passed" | "failed" | "waiting";
export type CheckKey = "registration" | "payout" | "leadership" | "address";

export const checkDefs: { key: CheckKey; label: string; hint: string; failHint: string }[] = [
  {
    key: "registration",
    label: "Registration certificate",
    hint: "CAC certificate matches the organization's name and trustees.",
    failHint: "The certificate doesn't match the name on the application.",
  },
  {
    key: "payout",
    label: "Payout account",
    hint: "The bank account is held in the organization's name.",
    failHint: "The account name doesn't match the organization.",
  },
  {
    key: "leadership",
    label: "Leadership confirmed",
    hint: "A named leader confirmed the application by phone.",
    failHint: "We couldn't reach the leaders listed.",
  },
  {
    key: "address",
    label: "Address",
    hint: "The address matches the registration documents.",
    failHint: "The address doesn't match the documents.",
  },
];


export type AuditAction =
  | "org_registered"
  | "org_verified"
  | "org_rejected"
  | "org_revoked"
  | "check_updated"
  | "campaign_submitted"
  | "campaign_approved"
  | "campaign_rejected"
  | "user_suspended"
  | "user_reactivated"
  | "role_changed"
  | "settings_updated"
  | "giving_paused"
  | "giving_resumed"
  | "note_added";

export type AuditEntry = {
  id: string;
  actor: string;
  action: AuditAction;
  target: { kind: "org" | "campaign" | "user" | "platform"; id?: string; name: string };
  detail?: string;
  at: string;
};

export type Note = { id: string; author: string; body: string; at: string };

export const rejectReasons = {
  org: [
    "Documents don't match the organization",
    "Payout account isn't in the organization's name",
    "We couldn't reach the leadership",
    "Not a faith-based organization",
  ],
  campaign: [
    "Story is missing key details",
    "Photos aren't of the real work",
    "Goal doesn't match the need described",
    "Organizer isn't verified yet",
  ],
};

/** "2 hours ago", "Yesterday", "3 Oct". */
export function timeAgo(iso: string) {
  const then = new Date(iso);
  const mins = Math.round((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function fullDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type FilterValue = Record<string, string[]>;

/** True when a row passes one filter field (an empty field lets everything through). */
export const matches = (value: FilterValue, key: string, v: string) =>
  !value[key]?.length || value[key].includes(v);
