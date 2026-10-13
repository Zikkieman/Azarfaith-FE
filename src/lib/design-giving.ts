import type { Campaign } from "./catalog";

/** Preset gift amounts, smallest first. Shared by the campaign give box and the checkout. */
export const presets = [5000, 10000, 25000, 50000];

/** Designer-provided illustrative suggestions, not measured campaign impact. */
const hints: Record<string, string[]> = {
  "Church Building": [
    "10 bags of cement",
    "A row of roofing sheets",
    "A set of pews",
    "Doors and windows",
  ],
  "Missions & Outreach": [
    "A week of fuel for an outreach team",
    "Bibles for a village",
    "A month of a missionary's food",
    "A motorbike service",
  ],
  Orphanage: [
    "Feeds a child for a week",
    "School shoes for 3 children",
    "A bunk bed mattress",
    "A full bunk bed",
  ],
  Education: [
    "Exercise books for a class",
    "A school uniform",
    "A term's textbooks",
    "A term's fees",
  ],
  "Food & Relief": [
    "Food for a family for 3 days",
    "A week of food for a family",
    "A month of food for a family",
    "Supplies for 10 families",
  ],
  "Medical Mission": [
    "Malaria test and treatment",
    "A clinic visit for 5 people",
    "A day of a mobile clinic",
    "Medicines for a village",
  ],
  Emergency: [
    "Water for a family for a week",
    "A blanket and mat",
    "A family relief pack",
    "Shelter for a family",
  ],
  "Community Development": [
    "A water filter",
    "A borehole repair part",
    "Seeds for a farm",
    "A solar lamp for 10 homes",
  ],
};

export function hintFor(c: Pick<Campaign, "faithCategory">, amount: number) {
  const i = presets.indexOf(amount);
  return i >= 0 ? hints[c.faithCategory]?.[i] : undefined;
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
  c.mode === "ongoing" ? [...(c.frequencies ?? []), "once"] : ["once"];
