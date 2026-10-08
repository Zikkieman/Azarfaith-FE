import type { PageDoc } from "@/components/pages/types";

export const orgPages: PageDoc[] = [
  {
    slug: "payouts",
    eyebrow: "For organizations",
    title: "Payouts",
    lead: "Once your organization is verified, you can move the donations held in your AzarFaith balance to your bank. This guide covers who may request a payout, the account rules that apply, and how long settlement takes after a request is submitted.",
    template: "guide",
    updated: "Updated 8 October 2026",
    blocks: [
      { type: "h2", text: "Who can request a payout" },
      {
        type: "bullets",
        items: [
          "Owner: request, approve and cancel payouts, and download statements.",
          "Finance admin or trustee: request and approve payouts, and download statements.",
          "Campaign manager: prepare a request and attach supporting documents, but cannot approve it.",
          "Viewer: read balances and statements only, with no payout actions.",
          "Every request and approval is logged with the staff member's name for your trustees to review.",
        ],
      },
      { type: "h2", text: "Verification and your payout account" },
      {
        type: "p",
        text: "Before your first payout, AzarFaith completes organization verification: your CAC registration details, confirmation of the authorized signatory, and a Naira bank account held in your exact registered name. Payouts settle only to that account. A personal account in a pastor's or treasurer's name is rejected even when that person is authorized internally, because it breaks the audit trail between your charity and the funds.",
      },
      {
        type: "bullets",
        items: [
          "The bank account name must match your CAC registered name character for character.",
          "The account must be a Nigerian Naira account at a bank we settle to.",
          "Changing payout details triggers re-verification and a five working day hold on new requests.",
          "Keep a board resolution or signatory letter on file in case our compliance team asks for it.",
        ],
      },
      { type: "h2", text: "Payout request timeline" },
      {
        type: "table",
        head: ["Step", "Who does it", "Timing"],
        rows: [
          [
            "Confirm the balance and open a payout request",
            "Finance admin or owner",
            "Any time; requests started before 15:00 WAT begin the same working day",
          ],
          [
            "Account name and compliance check",
            "AzarFaith operations",
            "Same working day to 1 working day",
          ],
          ["Bank transfer released", "Payment partner", "Within 1 working day of approval"],
          ["Funds land in your account", "Your bank", "2 to 5 working days after the request"],
          [
            "Statement becomes available to download",
            "Finance admin or owner",
            "As soon as the payout settles",
          ],
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "How long does a payout take?",
            a: "Settlement is 2 to 5 working days after your request clears compliance. Requests started before 15:00 WAT begin the same day; weekends and public holidays are not counted.",
          },
          {
            q: "Why was my payout returned?",
            a: "Most returns come from a name mismatch with your CAC registered name, incorrect NUBAN digits, or a dormant account. Correct the details in your settings, complete re-verification, then request the payout again.",
          },
          {
            q: "Can I download statements for our trustees?",
            a: "Yes. Finance admins and owners download a CSV or PDF statement of every donation, fee and payout. It updates the moment a payout settles, so board packs never rely on screenshots.",
          },
          {
            q: "Is there a minimum payout amount?",
            a: "You can request any balance above ₦5,000. Smaller amounts stay in your balance until they clear the minimum, so weekly gifts do not turn into transfers worth less than their cost.",
          },
        ],
      },
    ],
    cta: {
      heading: "Ready to move your balance?",
      text: "Complete verification once, then request payouts whenever your work needs funding.",
      primary: { label: "Open your dashboard", to: "/dashboard" },
      secondary: { label: "Register your organization", to: "/register-org" },
    },
  },
  {
    slug: "update-posts",
    eyebrow: "For organizations",
    title: "Campaign updates",
    lead: "Campaign updates are how your church, ministry or orphanage shows stewardship to the people who gave. Learn what a strong update contains, how often to post, and how a draft moves through moderation before it reaches givers and their receipt emails.",
    template: "guide",
    updated: "Updated 8 October 2026",
    blocks: [
      { type: "h2", text: "Why updates build trust" },
      {
        type: "p",
        text: "Givers on AzarFaith decide whether to give again mostly on what happens after the first gift. An update that shows money at work, such as a completed roof section, children enrolled or a missionary's rent paid, turns one-off donors into monthly partners. It is the single biggest driver of repeat giving to verified organizations, and a silent campaign reads as a stalled one.",
      },
      { type: "h2", text: "What a good update contains" },
      {
        type: "bullets",
        items: [
          "Two to four original photos with a caption stating where and when they were taken.",
          "Receipt or impact numbers: naira spent, items bought, people served, and what remains unspent.",
          "The next milestone and its target amount, so givers know what their next gift unlocks.",
          "A named signer, such as the pastor, project lead or trustee, who stands behind the claim.",
          "Plain language with no inflated promises and no unverifiable miracle or financial claims.",
        ],
      },
      { type: "h2", text: "Draft, review, publish" },
      {
        type: "p",
        text: "Every update begins as a draft in your organization dashboard, visible only to your team. An editor submits it, moderation checks it against the community guidelines, usually within one working day, and publishes it. The published update then appears on the campaign page timeline and is appended to the next receipt email sent to givers who gave to that campaign.",
      },
      {
        type: "steps",
        items: [
          "Open the campaign, choose Updates, and select Create draft.",
          "Add photos, numbers and the next milestone, then save the draft for your team.",
          "Submit for review so moderation can check claims, image rights and safeguarding.",
          "Publish: the update appears on the campaign page at once and notifies givers of that campaign.",
          "Read the engagement panel for views, click-throughs and any new gifts the update brought in.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "How often should we post?",
            a: "At least once a month while a campaign is open, and fortnightly during an active build. Long silences are the most common reason recurring givers stop, so post in quiet months too and explain what is being prepared.",
          },
          {
            q: "Who sees a new update?",
            a: "Everyone viewing the campaign page, plus givers who receive a receipt email for that campaign after publication. Givers subscribed to your updates also get a notification the same day the update goes live.",
          },
          {
            q: "Can we edit an update after publishing?",
            a: "Yes. Edits keep the original publication date and are marked as updated. Changes to amounts or major claims are re-checked by moderation before the edit appears, so givers never see an unreviewed figure.",
          },
          {
            q: "What happens if our update is rejected?",
            a: "You receive the reviewer's reason by email and in-app. Correct the issue and resubmit, or reply to the review or email support@azarfaith.ng if you disagree with the decision.",
          },
        ],
      },
    ],
    cta: {
      heading: "Keep your givers informed",
      text: "Publish your next update and show supporters exactly where their giving went.",
      primary: { label: "Go to your dashboard", to: "/dashboard" },
      secondary: { label: "See a live campaign", to: "/discover" },
    },
  },
  {
    slug: "fees-pricing",
    eyebrow: "For organizations",
    title: "Fees and pricing",
    lead: "AzarFaith charges one transparent platform fee of 2.5% on donations, with the payment processor's rate passed through at cost. Creating a campaign, getting verified, posting updates and downloading reports are free, and there are no monthly or setup charges.",
    template: "guide",
    updated: "Updated 8 October 2026",
    blocks: [
      { type: "h2", text: "What a gift costs" },
      {
        type: "p",
        text: "Every donation to your organization carries a 2.5% AzarFaith platform fee, deducted at the moment the gift settles. Card, bank transfer and USSD payments also carry a processor rate of about 1.4%, which we pass through without markup, so the rate you see is the rate the processor charges us. Nothing else is deducted from what your givers give.",
      },
      {
        type: "bullets",
        items: [
          "Free: campaign creation, organization verification and your verified badge, unlimited updates, and monthly or quarterly impact reports.",
          "Free: giver receipts, CSV and PDF exports, and payout statements for your trustees.",
          "Optional later: boosting a campaign to reach more givers, quoted per campaign and never taken from donations.",
          "No setup fee, no monthly subscription, and no charge on failed or refunded gifts.",
        ],
      },
      { type: "h2", text: "Fee schedule" },
      {
        type: "table",
        head: ["Fee", "Rate", "When it applies"],
        rows: [
          [
            "AzarFaith platform fee",
            "2.5%",
            "Deducted from every successful donation by card, bank transfer or USSD",
          ],
          [
            "Payment processor pass-through",
            "about 1.4%",
            "Charged by the processor on each successful gift and passed through at cost",
          ],
          [
            "Campaign boost",
            "Quoted per campaign",
            "Only if you choose to promote a campaign; never taken from donations",
          ],
          [
            "Monthly or account fee",
            "₦0",
            "Never; accounts, verification and reports carry no recurring charge",
          ],
        ],
      },
      { type: "h2", text: "Worked example: a ₦50,000 gift" },
      {
        type: "table",
        head: ["Line", "Amount"],
        rows: [
          ["Gift from a giver", "₦50,000"],
          ["AzarFaith platform fee at 2.5%", "−₦1,250"],
          ["Net before processor", "₦48,750"],
          ["Processor pass-through at about 1.4%", "−₦700"],
          ["Credited to your balance", "₦48,050"],
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "Are there hidden charges?",
            a: "No. The 2.5% platform fee and the processor pass-through are the only deductions on a donation. There is no monthly subscription, no fee for paying out to a Nigerian bank account, and no charge for verification, updates or reports.",
          },
          {
            q: "Who pays the fees?",
            a: "Fees are deducted before the gift reaches your balance, so the figure in your dashboard is always net. Givers receive a receipt showing their gift amount, and full fee detail stays in your dashboard for your records.",
          },
          {
            q: "Do failed or refunded gifts cost us anything?",
            a: "No. Fees are only taken on successfully settled donations. If a gift is refunded to the giver, the platform fee and the processor charge are reversed along with it.",
          },
          {
            q: "What does boosting cost?",
            a: "Boosting is optional and quoted per campaign. It is billed separately to your organization and never reduces the funds raised from givers, so your campaign total stays untouched.",
          },
          {
            q: "Is the processor rate fixed at 1.4%?",
            a: "About 1.4% is illustrative for Nigerian card, bank transfer and USSD payments. The exact pass-through appears on each gift in your dashboard, and we never add a markup to it.",
          },
        ],
      },
    ],
    cta: {
      heading: "Start raising with clear fees",
      text: "Create a campaign free, keep 97.5% of every gift before processor costs, and never pay a monthly fee.",
      primary: { label: "Create a campaign", to: "/create" },
      secondary: { label: "Register your organization", to: "/register-org" },
    },
  },
  {
    slug: "support",
    eyebrow: "For organizations",
    title: "Support",
    lead: "When a payout fails, a campaign question stalls or a safeguarding concern arises, AzarFaith support is reachable through the help centre, email and in-app chat. This page sets out each channel, our response targets by priority, and what to send for a fast fix.",
    template: "guide",
    updated: "Updated 8 October 2026",
    blocks: [
      { type: "h2", text: "Ways to reach us" },
      {
        type: "bullets",
        items: [
          "Help centre: searchable guides for payouts, verification, campaigns and reports, available at any hour.",
          "Email support@azarfaith.ng for account and campaign questions, or orgs@azarfaith.ng for verification and payout escalations.",
          "In-app chat on weekdays from 08:00 to 18:00 WAT, for anything you can describe while signed in to your dashboard.",
          "Always quote the payout ID or campaign link shown in your dashboard so we can find the record first time.",
        ],
      },
      { type: "h2", text: "Response targets and escalation" },
      {
        type: "bullets",
        items: [
          "Urgent, such as a failed payout, suspected fraud or a safeguarding issue: first reply within 4 working hours.",
          "High, such as blocked verification, a campaign under review or a giver dispute: first reply within 1 working day.",
          "Standard, such as how-to questions, statement requests or profile changes: first reply within 2 working days.",
          "Outside chat hours, urgent issues still reach the on-call team by email; mark the subject URGENT and copy orgs@azarfaith.ng.",
        ],
      },
      {
        type: "p",
        text: "For a failed payout or a safeguarding concern about a child featured in your content, escalate directly rather than waiting in the general queue. Email orgs@azarfaith.ng with the payout ID or campaign link, a short factual description and the best phone contact. Escalations are triaged first, and every reply names the person handling your case so your trustees can follow it.",
      },
      { type: "h2", text: "Get help fast" },
      {
        type: "steps",
        items: [
          "Sign in and copy your organization name and campaign link exactly as they appear in your dashboard.",
          "Open with the outcome you need: a returned payout, a rejected update or a missing receipt.",
          "Attach proof: payout ID, receipt number, a screenshot of the error, or the date and amount involved.",
          "Send through the channel that matches the priority above and keep the whole thread in one place.",
          "Reply with the documents we request in that same thread so we can close the case quickly.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "When is in-app chat open?",
            a: "Weekdays from 08:00 to 18:00 WAT. Outside those hours you can still start a chat and it is queued for the morning, while urgent payout or safety issues should go to email instead.",
          },
          {
            q: "How do I report a safeguarding concern?",
            a: "Email orgs@azarfaith.ng with the campaign link and a factual description. Do not post the concern publicly or contact the family yourself; our safeguarding reviewer responds within 4 working hours.",
          },
          {
            q: "Can we speak to someone by phone?",
            a: "We do not publish a support line. Email and in-app chat keep a written record, which lets us investigate payouts and verification questions accurately and share the outcome with your trustees.",
          },
          {
            q: "A payout failed overnight. What now?",
            a: "Check the reason beside the payout ID, correct your bank details and resubmit. If the reason is unclear or the money has left your balance, email support@azarfaith.ng with the payout ID for a same-day trace.",
          },
        ],
      },
    ],
    cta: {
      heading: "Need a hand today?",
      text: "Most organization questions are answered in the dashboard, and our team replies within one working day.",
      primary: { label: "Open your dashboard", to: "/dashboard" },
      secondary: { label: "Register your organization", to: "/register-org" },
    },
  },
  {
    slug: "guidelines",
    eyebrow: "For organizations",
    title: "Community guidelines",
    lead: "AzarFaith serves churches, missionaries, orphanages and faith-based schools alongside givers from many traditions. These guidelines set the standard for honest, respectful content and how moderation escalates from an edit request to a ban, and how to appeal.",
    template: "guide",
    updated: "Updated 8 October 2026",
    blocks: [
      { type: "h2", text: "Content standards" },
      {
        type: "bullets",
        items: [
          "Represent your work honestly: describe the need, the location and the use of funds as they actually are.",
          "Provide evidence of need, such as receipts, partner statements or dated photos of the project itself.",
          "No hate speech and no insults aimed at a faith, denomination, ethnicity or individual.",
          "No political campaigning, candidate endorsements or party material on any campaign.",
          "No fundraising for individuals outside our individual-giving policy; campaigns must support your organization's stated mission.",
          "No unverifiable miracle, healing or financial claims, and no guaranteed-return language about giving.",
        ],
      },
      { type: "h2", text: "Images, rights and safeguarding" },
      {
        type: "p",
        text: "Only publish photographs you have the right to use: your own, licensed, or shared with written permission from whoever took them. Captions must be accurate about when and where a photo was taken, and givers must never be presented as endorsing your organization when they have not agreed to it. Stewardship includes how you portray the people you serve.",
      },
      {
        type: "bullets",
        items: [
          "Never publish the full name, school, address, location tags or other identifying details of a vulnerable child.",
          "Use first names only, or no names at all, and frame images so children cannot be identified.",
          "Obtain a guardian's consent before photographing a child for a campaign, and keep that consent on file.",
          "Use respectful language across faiths and denominations, describing your own tradition without disparaging another.",
        ],
      },
      { type: "h2", text: "Moderation and appeals" },
      {
        type: "steps",
        items: [
          "Edit request: a reviewer asks you to change wording, a photo or a figure, and you normally have 72 hours to respond.",
          "Hide: content that breaches these guidelines is hidden from givers while your organization remains live.",
          "Suspend: repeat or serious breaches pause new donations and updates until the issue is resolved.",
          "Ban: deliberate fraud, exploitation or repeated breaches remove your organization from AzarFaith permanently.",
          "Appeal: reply in-app or email support@azarfaith.ng within 14 days with your evidence, and a second reviewer decides.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "What happens if we breach the guidelines once?",
            a: "A first, minor breach normally brings an edit request and a short note from a reviewer. Nothing is hidden until you have had the chance to correct it, unless the content risks immediate harm to a child or a giver.",
          },
          {
            q: "Can we campaign for a political cause?",
            a: "No. AzarFaith does not host political campaigning or candidate endorsements, even from faith-based organizations. Charitable projects with a non-partisan purpose are welcome, provided the content does not urge support for a party or candidate.",
          },
          {
            q: "Who reviews our content?",
            a: "Moderation reviewers trained in our content and safeguarding standards. Appeals are read by a different reviewer, so a decision is never confirmed by the person who made it.",
          },
          {
            q: "Can we appeal a suspension?",
            a: "Yes. Respond within 14 days of the decision with the evidence or context you believe was missed. Suspensions that are overturned are lifted the same working day, and your campaign page returns live without re-verification.",
          },
        ],
      },
    ],
    cta: {
      heading: "Publish with confidence",
      text: "Follow these standards and your campaigns stay live, trusted and visible to givers.",
      primary: { label: "Create a campaign", to: "/create" },
      secondary: { label: "Open your dashboard", to: "/dashboard" },
    },
  },
  {
    slug: "reports",
    eyebrow: "For organizations",
    title: "Impact reports",
    lead: "Trustees want more than a bank alert. AzarFaith generates monthly and quarterly impact reports per organization, covering donations, donors, payouts, campaign progress and update engagement, exportable as CSV or PDF and delivered to your inbox on a schedule.",
    template: "guide",
    updated: "Updated 8 October 2026",
    blocks: [
      { type: "h2", text: "What each report contains" },
      {
        type: "bullets",
        items: [
          "Donations received: gross gifts, fees and the net amount credited to your balance, per campaign and in total.",
          "Donor count: unique givers, first-time versus returning, and your repeat-giving rate for the period.",
          "Payout history: every request, its status, settlement date and destination account.",
          "Campaign progress: funds raised against target, active campaigns and days remaining.",
          "Update engagement: views, click-throughs and gifts attributed to each published update.",
        ],
      },
      { type: "h2", text: "Formats, sharing and delivery" },
      {
        type: "p",
        text: "Reports export as CSV for your accountant or audit file and as PDF for board packs, each carrying your organization name, the reporting period and amounts in Naira. Create a share link for trustees who need read-only access, or schedule delivery so the report reaches named board members each month without anyone having to remember to log in and download it.",
      },
      {
        type: "bullets",
        items: [
          "Monthly reports close on the first working day of the following month.",
          "Quarterly reports add trend comparisons against the previous quarter.",
          "Scheduled email delivery weekly, monthly or quarterly, to as many addresses as your board needs.",
          "Reports remain available for 24 months, so a past period can be reopened at any time.",
        ],
      },
      { type: "h2", text: "Generate a report" },
      {
        type: "steps",
        items: [
          "Open Reports in your organization dashboard and choose Monthly or Quarterly.",
          "Select the period, the campaigns to include, and whether fees are shown as a separate line.",
          "Choose a format, CSV for spreadsheets or PDF for trustees, and preview the figures.",
          "Download it, create a read-only share link, or save the selection as a scheduled email.",
          "Re-run the same selection next period, or let the saved schedule send it automatically.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "When is a period's data final?",
            a: "Data closes on the first working day of the following month, after the last payout of that period has settled. Figures are locked when the report is generated, so a PDF you share with trustees will not change later.",
          },
          {
            q: "Can trustees get their own access?",
            a: "Yes. Create a read-only share link or add their email to a scheduled delivery. Trustees see the report only; they cannot request payouts or edit campaigns unless you also give them that role in your team settings.",
          },
          {
            q: "Do reports include giver identities?",
            a: "Reports show donor counts and segments, plus first names where a giver has consented to be identified. Full contact details are never exported, in line with Nigerian data protection expectations and our privacy policy.",
          },
          {
            q: "Can we compare campaigns side by side?",
            a: "Yes. When generating a report, select multiple campaigns and the CSV exports one row set per campaign, while the PDF shows a comparison table with funds raised, donor count and update engagement for each.",
          },
        ],
      },
    ],
    cta: {
      heading: "Report like a steward",
      text: "Generate your first impact report and share clear figures with your trustees this week.",
      primary: { label: "Open your dashboard", to: "/dashboard" },
      secondary: { label: "Browse campaigns", to: "/discover" },
    },
  },
];
