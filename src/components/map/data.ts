/**
 * Sample figures for the /map prototype. Totals line up with the landing page
 * (≈₦35M a week, 480+ verified organisations). Replace with live aggregates later.
 */
export type Cause = "church" | "mission" | "orphanage" | "school";

export const causeLabel: Record<Cause, string> = {
  church: "Churches",
  mission: "Missions",
  orphanage: "Orphanages",
  school: "Schools",
};

export type StateStats = {
  orgs: Record<Cause, number>;
  givenWeek: number;
  receipts: number;
  featured?: { org: string; place: string; text: string; photo: string; to?: string };
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=960&q=80`;
const o = (church: number, mission: number, orphanage: number, school: number) => ({
  church,
  mission,
  orphanage,
  school,
});

export const stats: Record<string, StateStats> = {
  LA: {
    orgs: o(58, 9, 7, 12),
    givenWeek: 8_900_000,
    receipts: 214,
    featured: {
      org: "Church Under The Bridge Lagos",
      place: "Lagos Island",
      text: "Sunday meal served to 312 people under the bridge.",
      photo: u("1694286068611-d0c24cbc2cd5"),
      to: "/org/o2",
    },
  },
  FC: {
    orgs: o(31, 11, 4, 6),
    givenWeek: 3_600_000,
    receipts: 88,
    featured: {
      org: "CAPROS Nigeria",
      place: "Abuja",
      text: "Two new outreach teams commissioned for the North West.",
      photo: u("1632215734180-d8d7eae6164c"),
      to: "/org/o4",
    },
  },
  KD: {
    orgs: o(22, 14, 3, 5),
    givenWeek: 3_100_000,
    receipts: 71,
    featured: {
      org: "ECWA Mission Board",
      place: "Kaduna",
      text: "Missionary training graduates its 2026 class of 40.",
      photo: u("1604072424771-7300bc5de457"),
      to: "/org/o1",
    },
  },
  PL: {
    orgs: o(18, 6, 5, 3),
    givenWeek: 2_400_000,
    receipts: 63,
    featured: {
      org: "Grace Harvest Orphanage",
      place: "Jos",
      text: "All 20 bunk beds delivered and assembled.",
      photo: u("1710093072218-0024b8391475"),
      to: "/org/o3",
    },
  },
  OY: {
    orgs: o(24, 3, 3, 9),
    givenWeek: 2_200_000,
    receipts: 49,
    featured: {
      org: "Lifegate Christian Academy",
      place: "Ibadan",
      text: "Twelve scholarship students start the new term.",
      photo: u("1523396140703-e5bdad4e5dea"),
      to: "/org/o5",
    },
  },
  BO: {
    orgs: o(6, 12, 3, 1),
    givenWeek: 1_900_000,
    receipts: 44,
    featured: {
      org: "ECWA missionaries in Borno",
      place: "Maiduguri",
      text: "Twelve new communities reached this quarter.",
      photo: u("1509099836639-18ba1795216d"),
      to: "/campaign/gfc1",
    },
  },
  RI: { orgs: o(27, 3, 3, 4), givenWeek: 2_000_000, receipts: 41 },
  EN: { orgs: o(19, 2, 3, 4), givenWeek: 1_300_000, receipts: 30 },
  AN: { orgs: o(21, 1, 2, 3), givenWeek: 1_400_000, receipts: 33 },
  KN: { orgs: o(7, 8, 2, 1), givenWeek: 1_200_000, receipts: 27 },
  OG: { orgs: o(16, 2, 2, 5), givenWeek: 1_100_000, receipts: 26 },
  ED: { orgs: o(14, 2, 2, 2), givenWeek: 900_000, receipts: 19 },
  DE: { orgs: o(13, 2, 1, 2), givenWeek: 800_000, receipts: 17 },
  BE: { orgs: o(11, 3, 2, 1), givenWeek: 700_000, receipts: 16 },
  AD: { orgs: o(5, 6, 1, 1), givenWeek: 650_000, receipts: 14 },
  CR: { orgs: o(9, 2, 1, 1), givenWeek: 500_000, receipts: 12 },
  AK: { orgs: o(10, 1, 1, 1), givenWeek: 500_000, receipts: 11 },
  IM: { orgs: o(11, 1, 1, 1), givenWeek: 520_000, receipts: 12 },
  KW: { orgs: o(7, 2, 1, 1), givenWeek: 380_000, receipts: 9 },
  OS: { orgs: o(8, 1, 1, 2), givenWeek: 360_000, receipts: 8 },
  SO: { orgs: o(2, 5, 0, 0), givenWeek: 300_000, receipts: 7 },
  TA: { orgs: o(4, 3, 1, 0), givenWeek: 280_000, receipts: 6 },
  NI: { orgs: o(5, 2, 1, 0), givenWeek: 250_000, receipts: 6 },
  KO: { orgs: o(5, 1, 1, 1), givenWeek: 230_000, receipts: 5 },
  NA: { orgs: o(4, 2, 0, 1), givenWeek: 210_000, receipts: 5 },
  GO: { orgs: o(3, 2, 1, 0), givenWeek: 180_000, receipts: 4 },
  BA: { orgs: o(3, 2, 0, 0), givenWeek: 160_000, receipts: 4 },
  ON: { orgs: o(6, 1, 0, 1), givenWeek: 240_000, receipts: 5 },
  EK: { orgs: o(5, 0, 1, 1), givenWeek: 150_000, receipts: 3 },
  ZA: { orgs: o(1, 2, 0, 0), givenWeek: 90_000, receipts: 2 },
  KT: { orgs: o(1, 2, 0, 0), givenWeek: 80_000, receipts: 2 },
};

export const orgCount = (s: StateStats | undefined, cause: Cause | "all") =>
  !s ? 0 : cause === "all" ? Object.values(s.orgs).reduce((a, b) => a + b, 0) : s.orgs[cause];

const all = Object.values(stats);
export const totals = {
  givenWeek: all.reduce((a, s) => a + s.givenWeek, 0),
  orgs: all.reduce((a, s) => a + orgCount(s, "all"), 0),
  receipts: all.reduce((a, s) => a + s.receipts, 0),
};

/** Anonymous gifts for the live feed, cycled in order. */
export const feed: { state: string; amount: number; cause: Cause; place: string }[] = [
  { state: "LA", amount: 10_000, cause: "church", place: "a church in Surulere" },
  { state: "PL", amount: 25_000, cause: "orphanage", place: "an orphanage in Jos" },
  { state: "KN", amount: 5_000, cause: "mission", place: "a mission team in Kano" },
  { state: "RI", amount: 50_000, cause: "church", place: "a church in Port Harcourt" },
  { state: "FC", amount: 15_000, cause: "mission", place: "an outreach in Abuja" },
  { state: "OY", amount: 20_000, cause: "school", place: "a faith school in Ibadan" },
  { state: "BO", amount: 30_000, cause: "mission", place: "missionaries in Borno" },
  { state: "EN", amount: 7_500, cause: "church", place: "a church in Enugu" },
  { state: "KD", amount: 100_000, cause: "mission", place: "a mission board in Kaduna" },
  { state: "AN", amount: 12_000, cause: "orphanage", place: "a children's home in Onitsha" },
  { state: "OG", amount: 8_000, cause: "school", place: "a faith school in Abeokuta" },
  { state: "BE", amount: 6_000, cause: "church", place: "a church in Makurdi" },
  { state: "AD", amount: 40_000, cause: "mission", place: "a medical mission in Mubi" },
  { state: "LA", amount: 3_000, cause: "orphanage", place: "an orphanage in Ikorodu" },
];
