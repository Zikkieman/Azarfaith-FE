import type { PageDoc } from "@/components/pages/types";

export const legalPages: PageDoc[] = [
  {
    slug: "terms",
    eyebrow: "Legal",
    title: "Terms of Service",
    lead: "These terms govern how givers, churches, missionaries, orphanages and faith-based organizations use AzarFaith to run campaigns, receive support and settle Naira payouts. By creating an account or giving through the platform, you agree to them in full.",
    template: "legal",
    updated: "Last updated 8 October 2026",
    blocks: [
      {
        type: "p",
        text: "AzarFaith is a faith-based giving platform for givers and verified ministries across Nigeria. These Terms bind you; if you do not agree, do not use the platform.",
      },

      { type: "h2", text: "1. Acceptance of these terms" },
      {
        type: "p",
        text: "By signing up, donating, submitting a payout request or otherwise using AzarFaith, you accept these terms, our Privacy Policy and our Cookie Policy. If you act for a church, ministry, missionary, orphanage or faith-based organization, you confirm you can bind it.",
      },
      {
        type: "p",
        text: "We may update these terms; material changes appear here with a revised date, and continued use means acceptance.",
      },

      { type: "h2", text: "2. Eligibility" },
      {
        type: "p",
        text: "You must be at least 18 to create an account, give or receive funds on AzarFaith. Accounts for minors are not permitted, and you must be able to contract under Nigerian law with accurate, verifiable information.",
      },

      { type: "h2", text: "3. Your account" },
      {
        type: "p",
        text: "You are responsible for keeping your login credentials confidential and for all activity under your account. Tell support@azarfaith.ng promptly if you suspect unauthorised access.",
      },
      {
        type: "bullets",
        items: [
          "One account per person or organisation, matching your identity or registration documents.",
          "No sharing, selling or transferring accounts, and no new account created to dodge a suspension.",
          "Extra verification may be required before payouts.",
        ],
      },

      { type: "h2", text: "4. Campaigns and organization verification" },
      {
        type: "p",
        text: "Campaigns may be created only by or for a verified faith-based organization, church, ministry, missionary or orphanage. Verification means we reviewed registration documents, leadership and the receiving bank account before donations are accepted.",
      },
      {
        type: "steps",
        items: [
          "Submit your organization details and documents.",
          "Our team reviews and may ask questions.",
          "Once approved, your campaign goes live, with monitoring to keep payout details accurate.",
        ],
      },
      {
        type: "p",
        text: "Campaign owners must describe the need honestly and use funds for the stated purpose; we may pause a campaign while reviewing concerns raised by givers.",
      },

      { type: "h2", text: "5. Donations and the platform fee" },
      {
        type: "p",
        text: "Donations are made in Naira through bank transfer, card, and USSD style payment methods. AzarFaith charges a platform fee of 2.5% on each donation, shown before you confirm and deducted from the amount the organisation receives.",
      },
      {
        type: "callout",
        title: "Receipts",
        text: "Verified organisations may issue a donation receipt for your records. AzarFaith does not give tax advice — speak to your own adviser.",
      },

      { type: "h2", text: "6. Payouts and settlement" },
      {
        type: "p",
        text: "Verified organisations request a payout to the Nigerian bank account on file. Settlement is normally processed within 2 to 5 business days of an approved request, subject to bank clearing cycles.",
      },
      {
        type: "p",
        text: "We pay only into accounts held in the verified organisation's name and may delay a payout while a document issue or dispute is open.",
      },

      { type: "h2", text: "7. Prohibited use, content and suspension" },
      {
        type: "p",
        text: "Do not use AzarFaith to raise or move money in any of these ways.",
      },
      {
        type: "bullets",
        items: [
          "Fraud, impersonation, money laundering or forged documents.",
          "Personal or family fundraising outside our organisation policy.",
          "Hate speech, incitement or abuse aimed at any community.",
          "Unverified religious claims, such as miracles or guaranteed outcomes, used to solicit giving.",
          "Any activity banned by Nigerian law or your payment provider.",
        ],
      },
      {
        type: "p",
        text: "You keep ownership of what you upload and grant AzarFaith a non-exclusive licence to host and display it to run and safeguard the platform. You confirm you hold the rights and consent needed, including guardian consent where children appear.",
      },
      {
        type: "p",
        text: "We may suspend or close an account where these terms are breached, verification fails, or continued access would risk givers or funds, and we will release any balance not held for a dispute.",
      },

      { type: "h2", text: "8. Disclaimers, liability and indemnity" },
      {
        type: "p",
        text: "AzarFaith provides the technology and verification process that connects givers with ministries. We do not guarantee a campaign reaches its goal or that funds produce a specific outcome. To the extent permitted by law, the platform is provided as is.",
      },
      {
        type: "p",
        text: "We are not liable for indirect or consequential loss, and our total liability for any claim is limited to the platform fees we received from you in the three months before it arose. You indemnify AzarFaith against claims and costs arising from your content, campaign or breach of these terms.",
      },

      { type: "h2", text: "9. Governing law and contact" },
      {
        type: "p",
        text: "These terms are governed by the laws of Lagos State, Nigeria, whose courts have exclusive jurisdiction.",
      },
      {
        type: "p",
        text: "Send questions to legal@azarfaith.ng, and account or payout questions to support@azarfaith.ng.",
      },
    ],
  },
  {
    slug: "privacy",
    eyebrow: "Legal",
    title: "Privacy Policy",
    lead: "This policy explains what personal data AzarFaith collects from givers and faith-based organisations, why we process it under the Nigeria Data Protection Act 2023, who we share it with, and the rights you can exercise at any time.",
    template: "legal",
    updated: "Last updated 8 October 2026",
    blocks: [
      {
        type: "p",
        text: "AzarFaith treats stewardship of personal data as seriously as stewardship of donations. This policy explains what we handle when you give, run a campaign, receive a payout or browse the platform.",
      },
      {
        type: "p",
        text: "We process data in Nigeria under the Nigeria Data Protection Act 2023 (NDPA) and the Nigeria Data Protection Regulation 2019 (NDPR).",
      },

      { type: "h2", text: "1. Information we collect" },
      { type: "p", text: "We collect only what a trusted giving platform needs." },
      {
        type: "bullets",
        items: [
          "Account data: name, email, phone, password hash, role and organisation affiliation.",
          "Campaign data: descriptions, beneficiary information, images and verification documents.",
          "Donation data: amounts in Naira, campaign supported, payment method and transaction references.",
          "Payout data: bank name, account number, account name and settlement history.",
        ],
      },
      {
        type: "p",
        text: "When you contact support we keep your messages, and we record basic technical data such as device type, browser and pages viewed.",
      },

      { type: "h2", text: "2. Why we process your data" },
      {
        type: "p",
        text: "We process personal data to provide the service you asked for, to meet legal obligations, and to keep the platform safe.",
      },
      {
        type: "bullets",
        items: [
          "To create and secure your account and verify organisations before they receive funds.",
          "To process donations, issue receipts and settle payouts to Nigerian bank accounts.",
          "To prevent fraud and money laundering, and to resolve giver disputes.",
          "To send service messages and, where you have consented, campaign updates.",
          "To understand how the platform is used and improve it.",
        ],
      },

      { type: "h2", text: "3. Lawful basis under the NDPA" },
      {
        type: "p",
        text: "For each activity we rely on one or more lawful bases under the NDPA: performance of a contract (donations and payouts), legal obligation (identity and transaction records), consent (marketing and non-essential cookies), and legitimate interests (fraud prevention, security and improvement). You may withdraw consent at any time.",
      },

      { type: "h2", text: "4. Cookies and similar technologies" },
      {
        type: "p",
        text: "We use essential session cookies to keep you signed in, preference cookies to remember settings, analytics cookies to measure use, and marketing cookies to measure campaigns. Our Cookie Policy lists each one.",
      },
      {
        type: "callout",
        title: "Consent first",
        text: "Analytics and marketing cookies stay off until you say yes; only the cookies that are strictly necessary to run the platform run by default.",
      },

      { type: "h2", text: "5. Third-party processors" },
      {
        type: "p",
        text: "We share data with processors who act on our instructions under contract: payment providers handling bank transfer, card, and USSD style payments, cloud hosting and email providers, and analytics vendors. We do not sell personal data.",
      },
      {
        type: "p",
        text: "Payment providers may process card or bank details directly; we store only the confirmation and reference needed to record the donation. Processors must protect your data, use it only for the agreed purpose and delete it when the engagement ends.",
      },

      { type: "h2", text: "6. Retention and transfers" },
      {
        type: "bullets",
        items: [
          "Account records: life of the account plus up to 6 years where financial records are required.",
          "Donation and payout records: up to 6 years for Nigerian tax and audit rules.",
          "Campaign content: while published, plus a reasonable archive period.",
          "Support messages: up to 24 months after the conversation closes.",
          "Analytics data: in aggregate or pseudonymised form for up to 14 months.",
        ],
      },
      {
        type: "p",
        text: "Some processors store data outside Nigeria. Where personal data is transferred cross-border, we ensure the destination offers adequate protection or that safeguards such as contractual commitments are in place, as the NDPA requires.",
      },

      { type: "h2", text: "7. Your rights" },
      {
        type: "p",
        text: "Subject to the law, you may access, correct, delete, object to and port your personal data, and withdraw consent where processing relies on it.",
      },
      {
        type: "steps",
        items: [
          "Email support@azarfaith.ng from the address on your account.",
          "Say which right you are exercising and the scope of your request.",
          "We verify your identity and respond within the NDPA timeline.",
          "If you remain unhappy, you may complain to the Nigeria Data Protection Commission.",
        ],
      },

      { type: "h2", text: "8. Children's data" },
      {
        type: "p",
        text: "Givers must be 18 or older, and we do not knowingly create accounts for children. Where a campaign references children at an orphanage or faith-based school, we publish only what the responsible organisation is authorised to share and require guardian consent for identifiable images or stories. Contact us if you believe a child's data was processed without authorisation.",
      },

      { type: "h2", text: "9. Contact" },
      {
        type: "p",
        text: "For data-subject requests or concerns, write to support@azarfaith.ng, or to legal@azarfaith.ng for legal and regulatory matters. Include enough detail for us to locate your account.",
      },
    ],
  },
  {
    slug: "legal-notices",
    eyebrow: "Legal",
    title: "Legal Notices",
    lead: "Formal notices describing who operates AzarFaith, what the service does, how our brand may be used, and the limits of the information published on this platform. Read this alongside our Terms and Privacy Policy.",
    template: "legal",
    updated: "Last updated 8 October 2026",
    blocks: [
      {
        type: "p",
        text: "This page gathers the formal legal information about AzarFaith in one place: who we are, what the platform provides, how our name and marks are protected, and the disclaimers that apply to content published here.",
      },

      { type: "h2", text: "1. The service" },
      {
        type: "p",
        text: "AzarFaith is a technology platform that connects givers with churches, missionaries, orphanages and faith-based organisations in Nigeria. We provide campaign pages, donation processing in Naira, verification workflows for receiving organisations, and payout and reporting tools.",
      },
      {
        type: "p",
        text: "AzarFaith is not a bank, charity, religious denomination or investment platform. We do not endorse any theological position, ministry or beneficiary listed on the platform.",
      },

      { type: "h2", text: "2. Entity and contact" },
      {
        type: "p",
        text: "The AzarFaith platform is made available by its operator and its technical and verification partners. Correspondence should be addressed by role rather than individual name, so requests reach the right team.",
      },
      {
        type: "bullets",
        items: [
          "Legal, regulatory and rights enquiries: legal@azarfaith.ng",
          "Account, donation and payout support: support@azarfaith.ng",
          "Data-protection requests: support@azarfaith.ng, marked for the privacy team",
        ],
      },

      { type: "h2", text: "3. Trademarks and brand" },
      {
        type: "p",
        text: "AzarFaith, the AzarFaith wordmark and any associated logos or taglines are protected marks. No unauthorised use of the name, logo or brand styling is permitted in advertising, fundraising material, domain names or social handles.",
      },
      {
        type: "bullets",
        items: [
          "Verified organisations may state, factually, that they raise support through AzarFaith.",
          "Press and partners must not imply ownership of, or endorsement by, AzarFaith without written permission.",
          "Report impersonation or misuse of the brand to legal@azarfaith.ng.",
        ],
      },

      { type: "h2", text: "4. Third-party links and services" },
      {
        type: "p",
        text: "Campaigns, organisation profiles and receipts may link to third-party websites, including ministry pages, mapping services or bank portals. Those sites are operated independently and their content, security and privacy practices are not under our control.",
      },
      {
        type: "p",
        text: "A link does not mean we endorse the site or its operators. We encourage givers to review the receiving organisation's own information before giving, and to contact us if a link looks wrong or unsafe.",
      },

      { type: "h2", text: "5. Verification, regulatory and tax notice" },
      {
        type: "p",
        text: "Verification confirms that we reviewed documents provided by an organisation. It is a trust signal, not a guarantee of how funds will be spent, and it does not make AzarFaith responsible for a ministry's own governance.",
      },
      {
        type: "callout",
        title: "Receipts and tax",
        text: "Donations to verified organisations may be eligible for a receipt, and in some cases for relief under Nigerian law. AzarFaith does not give tax, accounting or legal advice — confirm your position with a qualified adviser.",
      },
      {
        type: "p",
        text: "Where required, we cooperate with requests from Nigerian regulators, law enforcement and the Nigeria Data Protection Commission in accordance with the law.",
      },

      { type: "h2", text: "6. Accuracy and availability" },
      {
        type: "p",
        text: "We work to keep information on AzarFaith accurate and the service available, but we do not warrant that content is complete, current or error-free, or that the platform will be uninterrupted or free of defects.",
      },
      {
        type: "p",
        text: "Campaign totals, payout times and verification status may change as transactions clear and reviews are completed. To the extent permitted by law, the platform is provided without warranties of any kind, and we exclude implied warranties to the maximum extent the law allows.",
      },

      { type: "h2", text: "7. Updates to these notices" },
      {
        type: "p",
        text: "We may revise these notices to reflect changes in the platform, our partners or applicable Nigerian law. The current version always carries the date shown at the top of this page.",
      },
    ],
  },
  {
    slug: "cookies",
    eyebrow: "Legal",
    title: "Cookie Policy",
    lead: "This policy lists the cookies AzarFaith uses — session, preference, analytics and marketing — explains what each one does and how long it lasts, and shows how to withdraw consent or disable cookies in your browser.",
    template: "legal",
    updated: "Last updated 8 October 2026",
    blocks: [
      {
        type: "p",
        text: "Cookies are small text files placed on your device when you visit AzarFaith. They let the platform remember who you are, hold your session while you complete a donation, and show us which campaigns givers actually find useful.",
      },
      {
        type: "p",
        text: "Under the NDPA and NDPR we need consent before setting anything that is not strictly necessary. Essential cookies are on by default; everything else waits for you to say yes.",
      },

      { type: "h2", text: "1. Essential cookies" },
      {
        type: "p",
        text: "These keep you signed in, protect forms against forgery, balance load across our servers and record your cookie choices. They are strictly necessary, so they cannot be switched off through our consent banner.",
      },
      {
        type: "bullets",
        items: [
          "Session cookie — holds your signed-in session, expires when you close the browser or the session times out.",
          "Security token — protects donation and payout forms, typically lasts the length of the session.",
          "Consent cookie — stores the choice you made in the banner, lasts up to 12 months.",
        ],
      },
      {
        type: "callout",
        title: "If you disable essential cookies",
        text: "The site will not work. You will be signed out repeatedly, donation forms will refuse to submit, your consent choice will be forgotten each visit, and payout requests may fail security checks. Leave essential cookies enabled.",
      },

      { type: "h2", text: "2. Preference cookies" },
      {
        type: "p",
        text: "Preference cookies remember choices you have made so you do not set them again — language and currency display, the campaign categories you follow, and how you like lists sorted. They usually last between 6 and 12 months, or until you clear them.",
      },
      {
        type: "p",
        text: "Turning them off does not stop you giving or running a campaign; it simply means your settings reset each time you return.",
      },

      { type: "h2", text: "3. Analytics cookies" },
      {
        type: "p",
        text: "Analytics cookies are set only after you consent. They tell us, in aggregate, which pages givers visit, where people abandon a donation, and which campaigns draw attention on mobile versus desktop. Session-level data lasts up to 24 hours, while the identifiers behind it last 6 to 14 months.",
      },
      {
        type: "p",
        text: "We use this to fix friction — a checkout step that drags on a small screen, for example — rather than to profile you. We do not sell analytics data.",
      },

      { type: "h2", text: "4. Marketing cookies" },
      {
        type: "p",
        text: "With your consent, marketing cookies help us measure whether a campaign message brought you to AzarFaith and how often you should hear from us. They last between 30 and 90 days. Refusing them costs you nothing: you keep full access to campaigns and receipts.",
      },

      { type: "h2", text: "5. Managing your consent" },
      {
        type: "steps",
        items: [
          "Open the cookie settings link in the footer to change or withdraw your choice at any time.",
          "In Chrome, Edge or Safari, go to Settings, then Privacy, then Cookies and site data, and block or delete cookies for this domain.",
          "Clearing site data for AzarFaith resets your session and your stored consent immediately.",
          "Email support@azarfaith.ng and we will confirm which categories are set and remove the optional ones.",
        ],
      },
      {
        type: "p",
        text: "Withdrawing consent does not affect processing carried out before the withdrawal, and it does not stop essential cookies needed to deliver the service you asked for.",
      },

      { type: "h2", text: "6. Updates and contact" },
      {
        type: "p",
        text: "We update this list whenever we add or retire a tool, and the date at the top tells you when it last changed. For questions about cookies or wider data use, contact support@azarfaith.ng, or legal@azarfaith.ng for legal enquiries.",
      },
    ],
  },
];
