// Routes linked by the restored landing design whose full content awaits migration.
export const landingGuideTitles: Record<string, string> = {
  organizations: "Verified organizations",
  "campaign-updates": "Latest campaign updates",
  "fees-pricing": "Fees and pricing",
  "emergency-appeals": "Emergency appeals",
  "team-giving": "Team giving",
  sponsorship: "Sponsorship",
  "matching-gifts": "Matching gifts",
  guidelines: "Community guidelines",
  reports: "Impact reports",
  "community-reports": "Community reports",
  refunds: "Refunds and cancellations",
  "platform-fee": "Platform fee",
  "data-protection": "Data protection",
  moderation: "Content moderation",
  "donor-stories": "Donor stories",
  blog: "Blog",
  careers: "Careers",
  press: "Press",
  guides: "Guides",
  events: "Events",
  manifesto: "Our manifesto",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  "legal-notices": "Legal Notices",
  cookies: "Cookie Policy",
};
export const landingGuidePreviews = Object.fromEntries(
  Object.entries(landingGuideTitles).map(([slug, title]) => [
    slug,
    {
      title,
      body: [
        "Design preview: this page is linked from the restored landing page. Its full designer screen and approved content are awaiting migration.",
        ["terms", "privacy", "legal-notices", "cookies"].includes(slug)
          ? "This is not an approved legal policy. Approved legal content is required before publication."
          : "This preview does not confirm that any new product feature, program, job, event, article or service is available.",
      ],
    },
  ]),
);
