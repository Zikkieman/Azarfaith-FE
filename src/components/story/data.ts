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
  "Organization information",
  "Registration documents or reference",
  "Leadership details",
  "Location details",
  "Payout account review",
  "Platform policies",
];

export const verifiedOrg = {
  name: "Verified organization",
  place: "Nigeria",
  photo: "",
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
}[] = Array.from({ length: 18 }, (_, index) => ({
  name: `Verified cause ${index + 1}`,
  place: "Nigeria",
  tags: index % 4 === 0 ? ["Children", "Northern Nigeria"] : index % 3 === 0 ? ["Missions"] : [],
  strong: index % 4 === 0 || index % 3 === 0,
  detail: "A published cause on AzarFaith",
}));

/** Scene 5: the life of one gift. */
export const pipeline = [
  { stage: "Discovered", detail: "Find a verified cause that matters to you" },
  { stage: "Given", detail: "Choose a one-time or recurring gift" },
  { stage: "Received", detail: "Your gift is recorded and a receipt is sent" },
  { stage: "Spent", detail: "Organizers can share spending evidence and updates" },
  { stage: "Reported", detail: "Follow new updates in your giving history" },
];
