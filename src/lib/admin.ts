/**
 * Admin-only data that the public app doesn't need: verification checks, contact and payout details
 * for each organization, internal notes and the audit log. Mock values stand in for the API.
 */

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

const allPassed: Record<CheckKey, CheckState> = {
  registration: "passed",
  payout: "passed",
  leadership: "passed",
  address: "passed",
};

export const checkSeed: Record<string, Record<CheckKey, CheckState>> = {
  o1: allPassed,
  o2: allPassed,
  o3: allPassed,
  o4: { registration: "passed", payout: "failed", leadership: "waiting", address: "passed" },
  o5: { registration: "waiting", payout: "waiting", leadership: "waiting", address: "waiting" },
};

export type OrgFile = {
  submittedAt: string;
  contactName: string;
  email: string;
  phone: string;
  bank: string;
  accountName: string;
  accountEnding: string;
  rcNumber: string;
  documents: { name: string; size: string }[];
};

const docs = (...names: string[]) =>
  names.map((name, i) => ({ name, size: `${(180 + i * 74) % 900}KB` }));

export const orgFiles: Record<string, OrgFile> = {
  o1: {
    submittedAt: "2024-02-11",
    contactName: "Rev. Daniel Yakubu",
    email: "missions@ecwa.org",
    phone: "+234 803 412 7765",
    bank: "First Bank",
    accountName: "ECWA Mission Board",
    accountEnding: "4821",
    rcNumber: "CAC/IT/4417",
    documents: docs("CAC certificate.pdf", "Board resolution.pdf"),
  },
  o2: {
    submittedAt: "2024-03-02",
    contactName: "Pastor Emeka Nwosu",
    email: "emeka@churchunderthebridge.org",
    phone: "+234 806 220 1193",
    bank: "GTBank",
    accountName: "Church Under The Bridge Lagos",
    accountEnding: "0937",
    rcNumber: "CAC/IT/90314",
    documents: docs("CAC certificate.pdf", "Trustee IDs.pdf"),
  },
  o3: {
    submittedAt: "2024-04-05",
    contactName: "Grace Adekunle",
    email: "grace@graceharvest.org",
    phone: "+234 809 776 0042",
    bank: "Access Bank",
    accountName: "Grace Harvest Orphanage",
    accountEnding: "5510",
    rcNumber: "CAC/IT/71182",
    documents: docs("CAC certificate.pdf", "Social welfare licence.pdf", "Board resolution.pdf"),
  },
  o4: {
    submittedAt: "2026-10-07",
    contactName: "Kolade Akinwale",
    email: "kolade@capros.org",
    phone: "+234 802 118 6630",
    bank: "Zenith Bank",
    accountName: "Kolade Akinwale",
    accountEnding: "7724",
    rcNumber: "CAC/IT/30566",
    documents: docs("CAC certificate.pdf", "Missions charter.pdf"),
  },
  o5: {
    submittedAt: "2026-09-24",
    contactName: "Mrs. Funmi Ade",
    email: "office@lifegateacademy.edu.ng",
    phone: "+234 805 990 1427",
    bank: "UBA",
    accountName: "Lifegate Christian Academy",
    accountEnding: "3306",
    rcNumber: "Not provided",
    documents: [],
  },
};

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

const daysAgo = (d: number, h = 10) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 12, 0, 0);
  return t.toISOString();
};

export const auditSeed: AuditEntry[] = [
  {
    id: "l1",
    actor: "CAPROS Nigeria",
    action: "org_registered",
    target: { kind: "org", id: "o4", name: "CAPROS Nigeria" },
    at: daysAgo(2, 9),
  },
  {
    id: "l2",
    actor: "Tunde Adebayo",
    action: "check_updated",
    target: { kind: "org", id: "o4", name: "CAPROS Nigeria" },
    detail: "Payout account failed: the account is in a personal name.",
    at: daysAgo(1, 15),
  },
  {
    id: "l3",
    actor: "Plateau Relief Network",
    action: "campaign_submitted",
    target: {
      kind: "campaign",
      id: "gfc6",
      name: "Emergency food for displaced Christians in Mangu",
    },
    at: daysAgo(2, 11),
  },
  {
    id: "l4",
    actor: "Tunde Adebayo",
    action: "user_suspended",
    target: { kind: "user", id: "u7", name: "David Ogundimu" },
    detail: "Reported for suspicious donation patterns.",
    at: daysAgo(14, 16),
  },
  {
    id: "l5",
    actor: "Tunde Adebayo",
    action: "org_verified",
    target: { kind: "org", id: "o3", name: "Grace Harvest Orphanage" },
    at: daysAgo(30, 13),
  },
];

export const noteSeed: Record<string, Note[]> = {
  o4: [
    {
      id: "n1",
      author: "Tunde Adebayo",
      body: "Called Kolade. He says the ministry account is being opened at Zenith; asked them to resubmit once it's in CAPROS's name.",
      at: daysAgo(1, 16),
    },
  ],
};

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
