import type { DonationDetail, DonationHistoryItem, RecurringDonation } from "./catalog";

export const money = (value: number) => `₦${value.toLocaleString("en-NG")}`;
export const givingDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
export const frequencyLabels = { weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly" };
export const donationDate = (donation: DonationHistoryItem) =>
  donation.paidAt ?? donation.createdAt;

export function givingSummary(donations: DonationHistoryItem[], now = new Date()) {
  const successful = donations.filter((donation) => donation.status === "succeeded");
  return {
    lifetime: successful.reduce((sum, donation) => sum + donation.amount, 0),
    month: successful
      .filter((donation) => donationDate(donation).slice(0, 7) === now.toISOString().slice(0, 7))
      .reduce((sum, donation) => sum + donation.amount, 0),
    campaigns: new Set(successful.map((donation) => donation.campaignId)).size,
    receipts: successful.length,
  };
}

export type GivingFilters = {
  search: string;
  status: string;
  kind: string;
  from: string;
  to: string;
};
export function filterGiving(donations: DonationHistoryItem[], filters: GivingFilters) {
  return donations
    .filter((donation) => {
      const day = donationDate(donation).slice(0, 10);
      return (
        (!filters.status || donation.status === filters.status) &&
        (!filters.kind ||
          (filters.kind === "recurring" ? Boolean(donation.frequency) : !donation.frequency)) &&
        (!filters.from || day >= filters.from) &&
        (!filters.to || day <= filters.to) &&
        [donation.campaignTitle, donation.organizationName, donation.reference]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(filters.search.trim().toLowerCase())
      );
    })
    .sort((a, b) => donationDate(b).localeCompare(donationDate(a)));
}

function csvCell(value: string | number) {
  const text = String(value);
  const first = Array.from(text).find(
    (character) => character.charCodeAt(0) > 32 && character.trim() !== "",
  );
  const safe = first && "=+@-".includes(first) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function givingCsv(donations: DonationHistoryItem[]) {
  const rows = [
    [
      "Date (UTC)",
      "Campaign",
      "Organization",
      "Type",
      "Status",
      "Gift (NGN)",
      "Platform fee (NGN)",
      "Tip (NGN)",
      "Total charged (NGN)",
      "Reference",
    ],
    ...donations.map((donation) => [
      donationDate(donation),
      donation.campaignTitle,
      donation.organizationName ?? "Independent campaign",
      donation.frequency ? frequencyLabels[donation.frequency] : "One-time",
      donation.status,
      donation.amount,
      donation.platformFee,
      donation.tipAmount,
      donation.totalCharged,
      donation.reference,
    ]),
  ];
  return "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function receiptHtml(donation: DonationDetail) {
  if (donation.status !== "succeeded")
    throw new Error("Receipts are only available for successful payments.");
  const escape = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  const rows = [
    ["Donor", donation.receipt.donorName],
    ["Campaign", donation.campaignTitle],
    ["Organization", donation.organizationName ?? "Independent campaign"],
    ["Date (UTC)", givingDate(donation.paidAt ?? donation.createdAt)],
    ["Gift", money(donation.amount)],
    ["Platform fee", money(donation.platformFee)],
    ["Tip to AzarFaith", money(donation.tipAmount)],
    ["Total charged", money(donation.totalCharged)],
    ["Reference", donation.reference],
  ];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>AzarFaith donation receipt</title><style>body{font:16px Georgia,serif;color:#130e30;max-width:680px;margin:40px auto;padding:24px}h1{border-bottom:2px solid #f59e0b;padding-bottom:20px}th,td{text-align:left;vertical-align:top;padding:12px;overflow-wrap:anywhere;border-bottom:1px solid #eee}table{width:100%;table-layout:fixed}th{width:35%}@media print{body{margin:0}}</style></head><body><h1>AzarFaith</h1><h2>Donation receipt</h2><table>${rows.map(([label, value]) => `<tr><th>${escape(label)}</th><td>${escape(value)}</td></tr>`).join("")}</table><p>Keep this receipt for your giving records. Use your browser's Print option to print or save as PDF.</p></body></html>`;
}

export function validateGiftChange(
  gift: RecurringDonation,
  amount: number,
  frequency: RecurringDonation["frequency"],
  consent: boolean,
) {
  if (
    !Number.isSafeInteger(amount) ||
    amount < gift.minDonation ||
    amount > gift.maxDonation ||
    amount + Math.round((amount * gift.platformFeePercent) / 100) > 2147483647
  )
    return `Enter a whole amount between ${money(gift.minDonation)} and ${money(gift.maxDonation)}.`;
  if (!gift.frequencies.includes(frequency))
    return "Choose a frequency supported by this campaign.";
  if (gift.mode === "auto" && !consent)
    return "Confirm consent to the new automatic gift before saving.";
  if (gift.amount === amount && gift.frequency === frequency)
    return "Choose a new amount or frequency.";
  return null;
}

export function downloadGivingFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
