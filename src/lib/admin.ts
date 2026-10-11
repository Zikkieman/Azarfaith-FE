import type { AdminPayoutItem, PayoutTransferStatus } from "./catalog";

export function payoutReleaseError(item: AdminPayoutItem, amount: number) {
  if (!item.payoutAccount?.active || item.payoutAccount.status !== "verified")
    return "A verified, active payout account is required.";
  if (!Number.isSafeInteger(amount) || amount < 1)
    return "Enter a whole-naira amount greater than zero.";
  if (amount > item.availableBalance) return "This amount exceeds the available balance.";
  return null;
}

export function payoutOutcome(status: PayoutTransferStatus) {
  return {
    success: "Paystack confirmed this payout.",
    pending: "Payout submitted. Paystack confirmation is pending.",
    otp: "Payout awaiting Paystack OTP confirmation.",
    failed: "Paystack reported that this payout failed.",
    reversed: "Paystack reported that this payout was reversed.",
  }[status];
}

export const humanizeAdminAction = (action: string) =>
  action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (first) => first.toUpperCase());
export function auditTarget(item: { entityType: string; entityId: string }) {
  const base = (
    { organization: "/admin/orgs", campaign: "/admin/campaigns", user: "/admin/users" } as Record<
      string,
      string
    >
  )[item.entityType];
  return base ? `${base}/${encodeURIComponent(item.entityId)}` : "/admin/settings";
}
