import type { Campaign } from "./domain";

/** Preset gift amounts, smallest first. Shared by the campaign give box and the checkout. */
export const presets = [5000, 10000, 25000, 50000];

/** Optional AzarFaith donation choices, shared by campaign pages and checkout. */
export const tipPresets = [0, 500, 1000, 2500];

/** Show whole-naira amounts with separators while a donor types. */
export function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function parseAmountInput(value: string) {
  return Number(value.replaceAll(",", "")) || 0;
}

export type Frequency = "once" | "weekly" | "monthly" | "quarterly";

export const frequencyLabel: Record<Frequency, string> = {
  once: "One time",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export const everyLabel: Record<Exclude<Frequency, "once">, string> = {
  weekly: "every week",
  monthly: "every month",
  quarterly: "every quarter",
};

/** Frequencies a campaign accepts: one-time campaigns take one-off gifts only. */
export const frequenciesFor = (c: Campaign): Frequency[] =>
  c.mode === "ongoing" ? [...(c.frequencies ?? ["monthly"]), "once"] : ["once"];

export const PLATFORM_FEE = 0.025;

export type PastGift = {
  id: string;
  date: string;
  campaignId: string;
  title: string;
  amount: number;
  kind: Frequency;
  receipt: string;
};

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

/** Next date after skipping one gift at this frequency. */
export function skipDate(iso: string, f: Exclude<Frequency, "once">) {
  const d = new Date(iso);
  if (f === "weekly") d.setDate(d.getDate() + 7);
  if (f === "monthly") d.setMonth(d.getMonth() + 1);
  if (f === "quarterly") d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}
