/** Story content for /story. One list per scene; tokens keep their index across scenes 1–3. */

export const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Scene 1: the old way. Forwarded, unverifiable appeals. */
export const appeals: { source: string; text: string; urgent?: boolean }[] = [
  {
    source: "WhatsApp · forwarded",
    text: "Building fund. Pls send to Pastor's account 0123…",
    urgent: true,
  },
  { source: "Flyer", text: "Orphanage roof appeal. Give before Sunday", urgent: true },
  { source: "SMS", text: "Account changed. Use 2290… from today" },
  { source: "WhatsApp", text: "Forward to 10 groups for blessings" },
  { source: "Email", text: "Re: Re: Mission trip support?" },
  { source: "Flyer", text: "Crusade 2026. Give now, details later" },
  { source: "WhatsApp", text: "Is this one real? Asking for my mum" },
  { source: "Bank alert", text: "Debit ₦20,000 · narration: offering" },
  { source: "WhatsApp", text: "Receipt will follow. It didn't." },
  { source: "Email", text: "Unknown sender: children's home needs…" },
  { source: "SMS", text: "Send airtime for the outreach team" },
  { source: "WhatsApp · forwarded", text: "Pay into my personal account for now", urgent: true },
  { source: "Flyer", text: "Scholarship fund. Account on request" },
  { source: "WhatsApp · forwarded many times", text: "Help a widow in Kano" },
  { source: "Email", text: "Annual report: coming soon" },
  { source: "Bank alert", text: "Transfer to 'Grace H.' Who is this?" },
  { source: "WhatsApp", text: "Did anyone confirm this one?" },
  { source: "Flyer", text: "Emergency food drive. Call this number", urgent: true },
];

/** Scene 2: the checks an organization passes before it can receive a naira. */
export const checks = [
  "CAC registration",
  "Bank account name match",
  "Leadership call",
  "Site visit · Jos",
  "Two references",
  "Safeguarding policy",
];

export const verifiedOrg = {
  name: "Grace Harvest Orphanage",
  place: "Jos, Plateau State",
  photo: unsplash("1521493959102-bdd6677fdd81", 400),
};

/** Scene 3: causes around the giver. `strong` ones match the giver's priorities. */
export const giverPriorities = ["Children", "Missions", "Northern Nigeria"] as const;
export type Priority = (typeof giverPriorities)[number];

export const causes: {
  name: string;
  place: string;
  tags: Priority[];
  strong?: boolean;
  detail: string;
}[] = [
  {
    name: "Grace Harvest bunk beds",
    place: "Jos",
    tags: ["Children", "Northern Nigeria"],
    strong: true,
    detail: "Verified · 65% funded · 89 givers",
  },
  { name: "Church car park resurfacing", place: "Ibadan", tags: [], detail: "Verified · building" },
  {
    name: "ECWA missionaries in Borno",
    place: "Borno",
    tags: ["Missions", "Northern Nigeria"],
    strong: true,
    detail: "Verified · monthly · 214 givers",
  },
  { name: "Choir robes", place: "Enugu", tags: [], detail: "Verified · one-time" },
  { name: "Anniversary banquet", place: "Abuja", tags: [], detail: "Verified · events" },
  {
    name: "Lifegate Academy fees",
    place: "Kaduna",
    tags: ["Children", "Northern Nigeria"],
    strong: true,
    detail: "Verified · 12 scholarships",
  },
  { name: "Media equipment", place: "Lagos", tags: [], detail: "Verified · equipment" },
  { name: "Stage lighting", place: "Port Harcourt", tags: [], detail: "Verified · equipment" },
  {
    name: "Mangu food relief",
    place: "Plateau",
    tags: ["Children", "Northern Nigeria"],
    strong: true,
    detail: "Verified · emergency · 178 givers",
  },
  { name: "Youth conference", place: "Abuja", tags: [], detail: "Verified · events" },
  { name: "Retreat centre fence", place: "Ogun", tags: [], detail: "Verified · building" },
  {
    name: "CAPROS village outreach",
    place: "Sokoto",
    tags: ["Missions", "Northern Nigeria"],
    strong: true,
    detail: "Verified · monthly · 61 givers",
  },
  { name: "Women's fellowship trip", place: "Calabar", tags: [], detail: "Verified · events" },
  { name: "Church bookshop stock", place: "Benin", tags: [], detail: "Verified · supplies" },
  { name: "Generator for the parish", place: "Owerri", tags: [], detail: "Verified · equipment" },
  { name: "Pastor's vehicle", place: "Akure", tags: [], detail: "Verified · transport" },
  { name: "Sound system upgrade", place: "Warri", tags: [], detail: "Verified · equipment" },
  {
    name: "Medical mission, Mubi",
    place: "Adamawa",
    tags: ["Missions", "Northern Nigeria"],
    detail: "Verified · medical · 40 givers",
  },
];

/** Scene 4: one campaign, opened up. Budget lines and receipts share a `key` for the hover link. */
export const campaign = {
  org: "Grace Harvest Orphanage",
  title: "20 bunk beds for new children",
  photo: unsplash("1509099927777-1b8a87bc3b21", 700),
  goal: 1_200_000,
  raised: 780_000,
  givers: 89,
  need: "47 children and 27 beds. Twenty children share a bed or sleep on mats.",
  budget: [
    { key: "beds", label: "20 bunk beds", amount: 780_000 },
    { key: "mattresses", label: "40 mattresses", amount: 360_000 },
    { key: "delivery", label: "Delivery and assembly", amount: 60_000 },
  ],
  receipts: [
    { key: "beds", label: "Jos Timber Works", amount: 780_000, date: "2 Oct" },
    { key: "mattresses", label: "Plateau Foam (deposit)", amount: 120_000, date: "5 Oct" },
    { key: "delivery", label: "Delivery", amount: 0, date: "Pending" },
  ],
  updates: [
    { date: "2 Oct", text: "Beds ordered from a local carpenter" },
    { date: "6 Oct", text: "First 10 beds delivered and assembled" },
  ],
};

/** Scene 5: the life of one gift. */
export const pipeline = [
  { stage: "Discovered", detail: "Grace Harvest, matched to your priorities" },
  { stage: "Given", detail: "₦25,000 monthly · Paystack receipt #A-2193" },
  { stage: "Received", detail: "₦24,375 to the verified account, after 2.5%" },
  { stage: "Spent", detail: "Receipt uploaded: Jos Timber Works" },
  { stage: "Reported", detail: "Update with photos posted to your history" },
];

/** Scene 6: the thank-you. */
export const update = {
  org: "Grace Harvest Orphanage",
  date: "Today",
  photo: unsplash("1710093072218-0024b8391475", 900),
  text: "All 20 bunk beds are in. Every child now has a bed of their own. Thank you for standing with us.",
};
