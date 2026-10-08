import type { PageDoc } from "@/components/pages/types";

export const trustPages: PageDoc[] = [
  {
    slug: "verification",
    eyebrow: "Trust & safety",
    title: "How we verify organizations",
    lead: "Every church, ministry, missionary, orphanage and faith-based school on AzarFaith passes a documented review before it can receive a single Naira. Verification checks identity, ownership of the receiving bank account, physical location and standing within the faith community.",
    template: "guide",
    updated: "October 2026",
    blocks: [
      {
        type: "p",
        text: "Givers should never have to guess whether an organization is real. AzarFaith verifies each applicant ourselves rather than relying on badges imported from elsewhere, and we publish a verified badge on the profile only after every check below has cleared.",
      },
      { type: "h2", text: "What an application must include", id: "application" },
      {
        type: "steps",
        items: [
          "Submit the organization application form with the legal name, faith category, primary contact and the account that will receive payouts.",
          "Upload the certificate of incorporation or CAC registration showing the organization exists as a registered entity.",
          "Provide government-issued ID for each named trustee or board member listed on the registration.",
          "Confirm the bank account is held in the organization's own name — third-party and personal accounts are declined.",
          "Give a physical address and proof of location, such as a utility bill or a signed letter from the denomination or mission body.",
          "Add a reference from an existing verified AzarFaith organization willing to confirm the work is genuine.",
          "Select the faith category: church, mission, orphanage, faith-based school or ministry.",
        ],
      },
      { type: "h2", text: "How long review takes", id: "review" },
      {
        type: "p",
        text: "A complete application is reviewed within 5 working days. If a document is unclear or a reference has not responded, we pause the clock and email the contact on file; nothing is approved on partial information. Approved organizations receive a verified badge on their public profile, and their receiving account is tested with a small payout before campaigns open to givers.",
      },
      {
        type: "table",
        head: ["Check", "What we confirm", "Renewed"],
        rows: [
          [
            "Legal identity",
            "Certificate of incorporation or CAC registration matches the applicant name",
            "Annually",
          ],
          [
            "Trustees and board",
            "Government ID for each named trustee or board member",
            "Annually",
          ],
          [
            "Bank account",
            "Account held in the organization's name, tested with a live payout",
            "On any account change",
          ],
          [
            "Physical location",
            "Address on file plus proof of location dated within 90 days",
            "Annually",
          ],
          [
            "Faith reference",
            "Reference from an existing verified organization in the same category",
            "Every 2 years",
          ],
          [
            "Faith category",
            "Church, mission, orphanage, school or ministry confirmed by the applicant",
            "Annually",
          ],
        ],
      },
      {
        type: "p",
        text: "Verification does not expire quietly. Organizations re-verify every year, and the badge is suspended while an overdue review is outstanding. A lapsed badge is visible to givers, so most organizations complete renewal well before the deadline.",
      },
      {
        type: "bullets",
        items: [
          "Verified organizations receive payouts in Naira to their registered account.",
          "Campaign updates are published on the profile so givers can follow stewardship over time.",
          "Any giver can report a verified organization, which triggers an immediate manual review.",
          "Suspension removes the badge and pauses new donations until the review closes.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "How long does verification take?",
            a: "Complete applications are reviewed within 5 working days. Missing documents or an unresponsive reference extend the timeline, and we notify the contact on file before the clock restarts.",
          },
          {
            q: "Can a personal or individual account receive donations?",
            a: "No. The receiving bank account must be held in the organization's registered name. Individual missionaries can apply through a sponsoring ministry or mission body that holds the account.",
          },
          {
            q: "What happens if our trustees or address change?",
            a: "Report the change from your dashboard. Address and trustee details are re-checked at annual re-verification, and bank account changes are verified before the next payout runs.",
          },
          {
            q: "Who can apply for a faith-based organization?",
            a: "Churches, missions, orphanages, faith-based schools and ministries with a certificate of incorporation or CAC registration, plus a reference from an organization already verified on AzarFaith.",
          },
          {
            q: "How do givers know an organization is verified?",
            a: "A verified badge appears on the public profile next to the faith category. Givers can also see the date the organization last completed verification.",
          },
        ],
      },
      {
        type: "callout",
        title: "Questions about a badge",
        text: "If you believe a verified badge was granted in error, write to safety@azarfaith.ng with the profile link. We review every report and respond within 2 working days.",
      },
    ],
    cta: {
      heading: "Apply to receive on AzarFaith",
      text: "Start the application and see the full document checklist before you upload anything.",
      primary: { label: "Start application", to: "/for-organizations" },
      secondary: { label: "See a verified profile", to: "/explore" },
    },
  },
  {
    slug: "community-reports",
    eyebrow: "Trust & safety",
    title: "Community reports",
    lead: "Givers, volunteers and organizations can flag a campaign, profile or payout on AzarFaith in a few clicks. Reports are read by a person, triaged by urgency, and closed with a written outcome so the person who reported knows what happened.",
    template: "guide",
    updated: "October 2026",
    blocks: [
      {
        type: "p",
        text: "The people closest to a project notice problems first: a campaign update that never arrives, a beneficiary photo that looks staged, an organization asking givers to send money outside the platform. Community reports turn those observations into action.",
      },
      { type: "h2", text: "What is worth reporting", id: "what" },
      {
        type: "bullets",
        items: [
          "A campaign that has gone silent with no updates after a pledged payout date.",
          "An organization asking a giver to pay by bank transfer or USSD outside AzarFaith.",
          "Images or claims that appear fabricated, or beneficiary details that do not add up.",
          "A profile using another organization's name, certificate or verified badge.",
          "Rude, abusive or discriminatory content in comments and campaign updates.",
          "Suspected fraud, including requests for the giver's card details or one-time codes.",
        ],
      },
      { type: "h2", text: "How a report is handled", id: "process" },
      {
        type: "steps",
        items: [
          "Open the profile or campaign and choose Report, or email safety@azarfaith.ng with the link.",
          "Pick the reason and add anything you saw — screenshots and dates speed up triage.",
          "We acknowledge the report and assign a severity within 1 working day.",
          "Serious reports pause new donations to the campaign while we review with the organization.",
          "We close the report with a written outcome, and you can appeal if you disagree.",
        ],
      },
      {
        type: "p",
        text: "Reports are never shared with the person or organization you reported, beyond the detail needed for them to respond. Repeated or bad-faith reports from the same account are throttled so the queue stays useful for genuine concerns.",
      },
      {
        type: "table",
        head: ["Severity", "Examples", "First response"],
        rows: [
          ["High", "Suspected fraud, impersonation, requests for card details", "Same working day"],
          [
            "Medium",
            "No updates after a payout date, unverified beneficiary claims",
            "2 working days",
          ],
          ["Low", "Comment moderation, wording concerns, minor profile errors", "5 working days"],
        ],
      },
      { type: "h2", text: "What happens to the organization", id: "outcomes" },
      {
        type: "p",
        text: "Outcomes range from a request for clarification, to a required campaign update, to suspension of the verified badge and frozen payouts pending a full review. Organizations can respond and appeal, and a suspended organization must complete re-verification before receiving again.",
      },
      {
        type: "faq",
        items: [
          {
            q: "Can I report anonymously?",
            a: "Yes. Reports submitted without an account are still reviewed. We ask for an email address only if we need to send you the outcome, and you may decline.",
          },
          {
            q: "Will the organization know I reported them?",
            a: "We do not disclose who filed a report. The organization sees the substance of the allegation so they can respond, but never your identity.",
          },
          {
            q: "How quickly are urgent reports acted on?",
            a: "Suspected fraud or impersonation is triaged the same working day and can pause new donations immediately while the review is open.",
          },
          {
            q: "What if my report is closed with no action?",
            a: "You receive a written explanation of why. If you disagree, reply to that message within 14 days and a second reviewer will look at it again.",
          },
          {
            q: "Can an organization report a giver?",
            a: "Yes. Organizations can flag abusive comments, chargeback abuse or impersonation of a donor through the same form, and those reports follow the same triage.",
          },
        ],
      },
      {
        type: "callout",
        text: "Send urgent reports, with the campaign link, to safety@azarfaith.ng. For account or donation questions, contact support@azarfaith.ng.",
      },
    ],
    cta: {
      heading: "See what is live on AzarFaith",
      text: "Browse verified organizations and their campaign updates before you give.",
      primary: { label: "Explore campaigns", to: "/explore" },
      secondary: { label: "Read verification rules", to: "/verification" },
    },
  },
  {
    slug: "refunds",
    eyebrow: "Trust & safety",
    title: "Refunds and cancellations",
    lead: "One-off donations can be requested for a refund within 48 hours if the campaign has not yet paid out. Recurring gifts can be cancelled at any time from your dashboard, and the next scheduled charge is stopped immediately.",
    template: "guide",
    updated: "October 2026",
    blocks: [
      {
        type: "p",
        text: "Giving on AzarFaith should feel deliberate. This page sets out exactly when a refund is possible, how to cancel a monthly gift, and what happens to money that has already reached a church, ministry, missionary, orphanage or faith-based school.",
      },
      { type: "h2", text: "Cancelling a recurring gift", id: "cancel" },
      {
        type: "steps",
        items: [
          "Open Dashboard, then Recurring gifts, and choose the gift you want to stop.",
          "Select Cancel; the gift status changes to cancelled straight away.",
          "Check the confirmation email from support@azarfaith.ng as your record.",
          "Any charge already taken stays with the organization unless a refund applies below.",
        ],
      },
      {
        type: "p",
        text: "Cancelling stops future charges only. It does not claw back gifts already sent, because that money may already be part of a payout the organization has planned around. Cancel before the next charge date if you want no further giving.",
      },
      { type: "h2", text: "When a refund is available", id: "refunds" },
      {
        type: "bullets",
        items: [
          "A duplicate charge caused by a retry or a slow bank response on card or bank transfer.",
          "A donation made in error, requested within 48 hours and before any payout has run.",
          "A campaign cancelled by the organization before funds were released.",
          "A payment that failed on your side but still showed as successful on AzarFaith.",
          "A verified badge suspended at the time of giving, where the campaign did not proceed.",
        ],
      },
      {
        type: "p",
        text: "Refunds return to the original payment method — card, bank transfer or USSD — and normally settle within 5 to 10 working days depending on your bank. Refunds are issued in Naira for the exact amount donated. Platform fees already paid to the payment processor are usually not recoverable, so a pass-through fee may be deducted where the processor does not return it.",
      },
      { type: "h2", text: "When a refund is not possible", id: "limits" },
      {
        type: "table",
        head: ["Situation", "Refund available", "What to do instead"],
        rows: [
          [
            "Payout already made to the organization",
            "No",
            "Ask the organization for an update on stewardship",
          ],
          [
            "Gift older than 48 hours, still unreleased",
            "Case by case",
            "Email support@azarfaith.ng with the receipt",
          ],
          [
            "Change of mind after funds are applied",
            "No",
            "Cancel the recurring gift to stop future giving",
          ],
          [
            "Chargeback filed without contacting us first",
            "Handled by your bank",
            "Contact support@azarfaith.ng so we can assist",
          ],
        ],
      },
      {
        type: "callout",
        title: "How to request a refund",
        text: "Email support@azarfaith.ng from the address on your account with the campaign name, amount, date and payment method. We confirm receipt within 1 working day.",
      },
      {
        type: "faq",
        items: [
          {
            q: "How do I cancel a monthly donation?",
            a: "Go to Dashboard, then Recurring gifts, choose the gift and select Cancel. The status changes immediately and no further charges are taken.",
          },
          {
            q: "Can I get a refund after the money was paid out?",
            a: "No. Once a payout has reached the organization, the funds are theirs to steward. We can help you request campaign updates instead.",
          },
          {
            q: "How long does a refund take to arrive?",
            a: "Most refunds appear within 5 to 10 working days on the original card or account, depending on your bank's processing times.",
          },
          {
            q: "Is the platform fee refunded too?",
            a: "Where the payment processor returns its pass-through fee, we refund it with your donation. If the processor retains it, that portion is not recoverable.",
          },
          {
            q: "What if I was charged twice for one gift?",
            a: "Duplicates are refunded automatically once detected, or immediately if you email support@azarfaith.ng with both transaction references.",
          },
        ],
      },
    ],
    cta: {
      heading: "Need a hand with a gift?",
      text: "Our team can check a charge, stop a recurring gift or start a refund review.",
      primary: { label: "Contact support", to: "/support" },
      secondary: { label: "Payment security", to: "/payment-security" },
    },
  },
  {
    slug: "payment-security",
    eyebrow: "Trust & safety",
    title: "Payment security",
    lead: "Donations on AzarFaith are taken by licensed payment processors over encrypted connections, never stored by us, and released to organizations only after verification and payout checks. Card, bank transfer and USSD all follow the same rule.",
    template: "guide",
    updated: "October 2026",
    blocks: [
      {
        type: "p",
        text: "AzarFaith never holds your card number, PIN or one-time code. Payment details are captured by our licensed processor and tokenized there, so our systems work with a reference rather than the credential itself.",
      },
      { type: "h2", text: "How a donation travels", id: "flow" },
      {
        type: "steps",
        items: [
          "You choose a campaign and enter an amount in Naira on the AzarFaith checkout.",
          "Your card, bank transfer or USSD payment is authorized by the processor on their secure page.",
          "AzarFaith receives a confirmation token only — no card number, PIN or BVN is stored with us.",
          "Funds are queued for payout once the organization's verification status and account name match.",
          "You get a receipt by email, and the gift appears in your giving history.",
        ],
      },
      {
        type: "bullets",
        items: [
          "All traffic between you and AzarFaith is encrypted in transit.",
          "Card credentials are tokenized by the processor, never written to our database.",
          "Payouts go only to a bank account in the organization's verified name.",
          "Accounts with new devices require a one-time code before a gift can be sent.",
          "Staff access to payout details is limited, logged and reviewed.",
        ],
      },
      { type: "h2", text: "Bank transfers and USSD", id: "methods" },
      {
        type: "p",
        text: "Bank transfer gifts are matched to your checkout reference automatically, usually within minutes. If your bank shows the transfer as debited but AzarFaith has not confirmed it, do not send it again — contact support@azarfaith.ng with the reference and we will reconcile it. USSD gifts use your bank's own USSD session, so AzarFaith never sees your PIN.",
      },
      {
        type: "table",
        head: ["Method", "What AzarFaith stores", "Typical confirmation"],
        rows: [
          ["Card", "Processor token, last four digits, expiry month", "Seconds"],
          ["Bank transfer", "Checkout reference and amount", "Minutes to a few hours"],
          ["USSD", "Session reference and amount", "Seconds"],
        ],
      },
      { type: "h2", text: "Protecting your giving account", id: "account" },
      {
        type: "p",
        text: "Use a unique password, keep the one-time code to yourself, and review your giving history after a gift. AzarFaith staff will never ask for your password or one-time code by email, phone or message. If someone claims to be from AzarFaith and asks for a code, stop and write to safety@azarfaith.ng.",
      },
      {
        type: "faq",
        items: [
          {
            q: "Does AzarFaith store my card details?",
            a: "No. Card data is captured and tokenized by our licensed payment processor. We only receive a reference, the amount and the last four digits for your receipt.",
          },
          {
            q: "Are donations protected against fraud?",
            a: "Payments run over encrypted connections, payouts are restricted to verified accounts in the organization's name, and suspicious activity pauses a gift for manual review.",
          },
          {
            q: "What should I do if I see an unfamiliar gift?",
            a: "Email support@azarfaith.ng immediately from your registered address. We can freeze the account, review sessions on the device and start a refund assessment.",
          },
          {
            q: "Can I give by bank transfer instead of a card?",
            a: "Yes. Choose bank transfer at checkout and send the exact amount to the reference shown. Matching is automatic and your receipt follows once confirmed.",
          },
          {
            q: "Is my giving history private?",
            a: "Yes. Only you can see your giving history, and organizations see a giver as an anonymous or first-name entry unless you choose to share more.",
          },
        ],
      },
      {
        type: "callout",
        title: "Report something suspicious",
        text: "If a message, page or person asks for your card details or one-time code while claiming to be AzarFaith, forward it to safety@azarfaith.ng and do not respond.",
      },
    ],
    cta: {
      heading: "Give with confidence",
      text: "Every campaign you see belongs to an organization that passed our verification checks.",
      primary: { label: "Browse campaigns", to: "/explore" },
      secondary: { label: "How we verify", to: "/verification" },
    },
  },
  {
    slug: "platform-fee",
    eyebrow: "Trust & safety",
    title: "Platform fee",
    lead: "AzarFaith charges a flat 2.5% platform fee on each donation to keep verification, payouts and support running. A payment-processor pass-through may add roughly 1.4%, shown as an illustrative figure rather than a guaranteed rate.",
    template: "guide",
    updated: "October 2026",
    blocks: [
      {
        type: "p",
        text: "Givers deserve to know where their Naira goes. This page explains the 2.5% platform fee, the separate processor pass-through, and how to read the exact breakdown shown at checkout before you confirm a gift.",
      },
      { type: "h2", text: "The breakdown", id: "breakdown" },
      {
        type: "p",
        text: "For a ₦10,000 donation, the platform fee is ₦250. The payment processor's pass-through is additional and varies by method — card payments typically cost more than bank transfer. The illustrative figure of about 1.4% is a common range, not a promise; the real number is always printed on your checkout screen and receipt.",
      },
      {
        type: "table",
        head: ["Who pays", "Fee", "Notes"],
        rows: [
          [
            "Giver",
            "Included in the gift",
            "Shown at checkout as a separate line before you confirm",
          ],
          [
            "AzarFaith platform fee",
            "2.5% of the donation",
            "Funds verification, moderation, support and platform upkeep",
          ],
          [
            "Payment processor pass-through",
            "About 1.4% (illustrative)",
            "Varies by card, bank transfer or USSD; not guaranteed",
          ],
          ["Verified organization", "0%", "Organizations never pay a listing or campaign fee"],
          [
            "Payout to a Naira account",
            "0%",
            "Standard payouts to the organization's registered account are free",
          ],
        ],
      },
      { type: "h2", text: "What the 2.5% pays for", id: "what" },
      {
        type: "bullets",
        items: [
          "Document review, trustee checks and annual re-verification for every organization.",
          "Payout controls, fraud monitoring and the manual review behind community reports.",
          "Campaign update monitoring so givers can follow stewardship after they give.",
          "Support inbox staffing for givers and organizations, seven days a week.",
          "Hosting, security testing and compliance work including data protection obligations.",
        ],
      },
      {
        type: "p",
        text: "Because the platform fee is a percentage, small gifts and large gifts pay the same proportion — a ₦1,000 gift carries ₦25, and a ₦100,000 gift carries ₦2,500. There is no monthly charge, no listing fee and no charge for creating a campaign.",
      },
      { type: "h2", text: "Fees and refunds", id: "fees-refunds" },
      {
        type: "p",
        text: "When a refund is approved, we return the donation amount and the platform fee. The processor's pass-through is returned only where the processor releases it, which is why some refunds arrive slightly below the original gift. See refunds for the full conditions.",
      },
      {
        type: "faq",
        items: [
          {
            q: "Who pays the 2.5% platform fee?",
            a: "It is taken from the donation itself, so givers see it as a transparent line at checkout and organizations receive the rest. Organizations pay nothing out of pocket.",
          },
          {
            q: "Is the 1.4% processor fee guaranteed?",
            a: "No. It is an illustrative figure based on common Nigerian card rates. Your checkout shows the exact pass-through for your chosen payment method before you confirm.",
          },
          {
            q: "Are there any other charges?",
            a: "No listing fee, no monthly subscription and no charge for payouts. The only additions to a gift are the 2.5% platform fee and the processor pass-through.",
          },
          {
            q: "Does the fee change with the amount I give?",
            a: "No. The rate stays at 2.5% whether you give ₦1,000 or ₦1,000,000, so the cost always scales with the gift.",
          },
          {
            q: "Can I cover the fee so the organization gets the full amount?",
            a: "Yes. Tick the option at checkout to add the fee on top of your gift, and the organization receives the entire amount you intended.",
          },
        ],
      },
      {
        type: "callout",
        title: "Fees look wrong?",
        text: "Send your receipt to support@azarfaith.ng and we will walk through the calculation line by line, including any processor pass-through.",
      },
    ],
    cta: {
      heading: "Give the full amount you intended",
      text: "Add the fee at checkout so your church, ministry or orphanage receives 100% of your gift.",
      primary: { label: "Start giving", to: "/explore" },
      secondary: { label: "Refund policy", to: "/refunds" },
    },
  },
  {
    slug: "data-protection",
    eyebrow: "Trust & safety",
    title: "Data protection",
    lead: "AzarFaith collects only what a giving platform needs — your name, email, giving history and payment reference — and processes it under the NDPR 2019 and the Nigeria Data Protection Act 2023. You can request a copy or a deletion at any time.",
    template: "guide",
    updated: "October 2026",
    blocks: [
      {
        type: "p",
        text: "This page explains what AzarFaith collects from givers, organizations and visitors, why we collect it, how long we keep it, and the choices you have under Nigerian data protection law.",
      },
      { type: "h2", text: "What we collect", id: "collect" },
      {
        type: "bullets",
        items: [
          "Account details: name, email address and a hashed password you choose.",
          "Giving records: amounts, dates, campaigns supported and payment method type.",
          "Payment references and tokens returned by our processor — never your card number, PIN or BVN.",
          "Organization records: registration documents, trustee IDs, addresses and bank account details needed for verification.",
          "Technical data: device, browser and basic log entries used for security and fraud prevention.",
        ],
      },
      { type: "h2", text: "Why we process it", id: "lawful" },
      {
        type: "table",
        head: ["Purpose", "Data used", "Legal basis"],
        rows: [
          [
            "Processing a donation",
            "Giving record, payment reference",
            "Performance of a contract",
          ],
          [
            "Verifying an organization",
            "Registration, trustee ID, address, bank details",
            "Legal obligation and legitimate interest",
          ],
          ["Preventing fraud", "Device, logs, transaction pattern", "Legitimate interest"],
          [
            "Sending receipts and updates",
            "Name, email, campaign choices",
            "Consent, withdrawable at any time",
          ],
          ["Meeting regulatory duties", "Transaction and payout records", "Legal obligation"],
        ],
      },
      {
        type: "p",
        text: "We do not sell personal data. Organizations never see a giver's card details or full payment reference, and a giver appears to an organization as a first name or an anonymous entry depending on your giving preference.",
      },
      { type: "h2", text: "Your rights", id: "rights" },
      {
        type: "steps",
        items: [
          "Request access to the personal data we hold about you.",
          "Ask for correction of anything inaccurate or out of date.",
          "Request deletion, subject to records we must keep for tax and anti-fraud duties.",
          "Object to processing or withdraw consent, including marketing messages.",
          "Request a portable copy of your giving history in a common format.",
          "Lodge a complaint with the Nigeria Data Protection Commission if you remain dissatisfied.",
        ],
      },
      {
        type: "p",
        text: "To exercise any of these rights, email support@azarfaith.ng from your registered address. We respond within 7 days and complete verified requests within 30 days. We may ask for confirmation of identity before releasing or deleting data.",
      },
      { type: "h2", text: "Retention and security", id: "retention" },
      {
        type: "p",
        text: "Giving and payout records are kept for as long as Nigerian tax and reporting rules require, then deleted or anonymized. Marketing consents are dropped the moment you withdraw them. Data is encrypted in transit, access is role-based and logged, and any suspected breach is assessed immediately and reported to the Nigeria Data Protection Commission where the law requires it.",
      },
      {
        type: "faq",
        items: [
          {
            q: "Which laws apply to AzarFaith?",
            a: "We process personal data in line with the Nigeria Data Protection Regulation 2019 and the Nigeria Data Protection Act 2023, overseen by the Nigeria Data Protection Commission.",
          },
          {
            q: "Do you share my data with the organizations I support?",
            a: "Only what is needed for them to thank you — a first name or an anonymous reference. Payment details, email address and full giving history stay with AzarFaith.",
          },
          {
            q: "Is my data stored outside Nigeria?",
            a: "Some infrastructure may be hosted outside Nigeria, in which case we apply contractual and security safeguards required for cross-border transfers under the Act.",
          },
          {
            q: "How do I delete my account and data?",
            a: "Email support@azarfaith.ng requesting deletion. We remove what we can and retain only transaction records we are legally required to keep.",
          },
          {
            q: "How do I stop campaign emails?",
            a: "Use the unsubscribe link in any message or turn off updates in your dashboard. Transactional receipts and security notices will still be sent.",
          },
        ],
      },
      {
        type: "callout",
        title: "Data protection requests",
        text: "Send access, correction or deletion requests to support@azarfaith.ng. Report a suspected exposure of your information to safety@azarfaith.ng straight away.",
      },
    ],
    cta: {
      heading: "Control your giving data",
      text: "Review your preferences, receipts and consents from your AzarFaith dashboard.",
      primary: { label: "Open dashboard", to: "/dashboard" },
      secondary: { label: "Payment security", to: "/payment-security" },
    },
  },
  {
    slug: "moderation",
    eyebrow: "Trust & safety",
    title: "Content moderation",
    lead: "Campaign pages, updates and comments on AzarFaith are reviewed by people as well as automated filters. We remove content that deceives givers, exposes beneficiaries, or turns a place of worship into a place of abuse.",
    template: "guide",
    updated: "October 2026",
    blocks: [
      {
        type: "p",
        text: "Moderation exists so a giver can read a campaign update and trust what is written there. It also protects the children, families and congregations these organizations serve from being exposed for the sake of a donation.",
      },
      { type: "h2", text: "What we do not allow", id: "rules" },
      {
        type: "bullets",
        items: [
          "Unverified claims about beneficiaries, expenses or where money will go.",
          "Full names, school details or identifiable images of children in care.",
          "Content that shames, threatens or discriminates against a person or group.",
          "Requests to move a gift off AzarFaith by bank transfer, USSD or cash.",
          "Political campaigning, gambling promotion or sales pitches dressed as appeals.",
          "Copied campaign text or photos belonging to another organization.",
        ],
      },
      { type: "h2", text: "How content is reviewed", id: "process" },
      {
        type: "steps",
        items: [
          "Publishers submit campaign text, images and updates through the AzarFaith dashboard.",
          "Automated checks flag obvious risks such as contact details or duplicate images.",
          "A moderator reads every new campaign and every update before it goes public.",
          "Reported comments and pages are triaged by severity, with high-risk items paused first.",
          "The organization is told what was changed and why, and may appeal once.",
        ],
      },
      {
        type: "table",
        head: ["Content", "Review before publishing", "Typical turnaround"],
        rows: [
          ["New campaign", "Full human review", "2 working days"],
          ["Campaign update", "Human review", "1 working day"],
          [
            "Comment on a campaign",
            "Automated checks plus reported review",
            "Hours to 1 working day",
          ],
          ["Profile and images", "Human review", "2 working days"],
        ],
      },
      {
        type: "p",
        text: "Organizations are told what was changed and why, and may appeal once. Appeals are read by a second moderator who did not handle the original decision, and the outcome is sent in writing.",
      },
      { type: "h2", text: "Protecting beneficiaries", id: "beneficiaries" },
      {
        type: "p",
        text: "Children in orphanages and faith-based schools are the people most at risk from a well-meaning appeal. We ask for first names or initials only, no school or house addresses, no close-up images that identify a child, and no stories published without consent from a guardian. Repeated breaches put the verified badge under review.",
      },
      {
        type: "callout",
        title: "Report content",
        text: "Use the Report link under any post, or email safety@azarfaith.ng with the campaign link. Suspected exposure of a child is treated as high severity and reviewed the same working day.",
      },
      {
        type: "faq",
        items: [
          {
            q: "Why was my campaign update not published?",
            a: "It likely contained a claim we could not verify, a beneficiary detail we must protect, or contact details that would move giving off AzarFaith. The notice explains which rule applies.",
          },
          {
            q: "Can I appeal a moderation decision?",
            a: "Yes. Reply to the notice within 14 days. A second moderator who did not make the original decision reviews it and writes back.",
          },
          {
            q: "Who moderates comments?",
            a: "Automated filters catch the obvious cases, and anything reported is read by a moderator. High-severity comments are hidden while the review is open.",
          },
          {
            q: "Do you allow photos of children we support?",
            a: "Only where a guardian has consented and the child cannot be identified — first names or initials, no school or home details, no identifying close-ups.",
          },
          {
            q: "What happens to repeat offenders?",
            a: "Warnings come first, then required edits, then suspension of the verified badge and a pause on new donations until re-verification completes.",
          },
        ],
      },
    ],
    cta: {
      heading: "Help us keep appeals honest",
      text: "Report anything on a campaign page that looks misleading or unsafe.",
      primary: { label: "Read community reports", to: "/community-reports" },
      secondary: { label: "See verified organizations", to: "/explore" },
    },
  },
  {
    slug: "donor-stories",
    eyebrow: "Stories",
    title: "Donor stories",
    lead: "Givers across Nigeria support churches, missionaries, orphanages and faith-based schools on AzarFaith in different ways — a small monthly gift, a one-off donation at harvest, a sponsored place at a faith-based school. These are six of their stories.",
    template: "cards",
    updated: "October 2026",
    blocks: [
      {
        type: "p",
        text: "Every gift on AzarFaith comes from a decision someone made with their own money. We asked six givers what they give, why they chose it, and what keeps them coming back.",
      },
      { type: "h2", text: "From the givers", id: "from-the-givers" },
      {
        type: "cards",
        items: [
          {
            title: "A monthly gift that became a habit",
            meta: "Lagos · Education · ₦45,000",
            tag: "Monthly giver",
            text: "Chinelo set up a ₦45,000 monthly gift to a faith-based school in Lagos and now reads every campaign update before her next charge goes out.",
          },
          {
            title: "Giving through bank transfer",
            meta: "Kano · Orphanage · ₦120,000",
            tag: "Bank transfer",
            text: "Sani prefers bank transfer to card, so he gives in Naira from his banking app and matches the checkout reference without leaving the platform.",
          },
          {
            title: "USSD giving from a basic phone",
            meta: "Enugu · Church · ₦5,000",
            tag: "USSD giver",
            text: "Ngozi gives ₦5,000 by USSD from a feature phone, proof that supporting a church does not require a smartphone or a debit card.",
          },
          {
            title: "Sponsoring a missionary's term",
            meta: "Ibadan · Mission · ₦75,000",
            tag: "Quarterly giver",
            text: "Tunde supports one missionary each quarter and says the verified badge is what convinced him the money reaches the mission field.",
          },
          {
            title: "A family gift at harvest",
            meta: "Abuja · Ministry · ₦250,000",
            tag: "One-off giver",
            text: "The Adeyemi family pools money each December and gives once to a ministry feeding households in Abuja, then follows the updates together.",
          },
          {
            title: "Switching from cash to the platform",
            meta: "Port Harcourt · Orphanage · ₦30,000",
            tag: "Monthly giver",
            text: "Ifeoma used to hand over cash at the gate; she now gives ₦30,000 monthly on AzarFaith so she can see how the orphanage stewards it.",
          },
        ],
      },
      { type: "h2", text: "What donors say", id: "what-donors-say" },
      {
        type: "quote",
        text: "I stopped wondering whether my offering ever arrived. The updates tell me what the money did, and the verified badge tells me who is holding it.",
        by: "Chinelo, monthly giver, Lagos",
      },
      {
        type: "quote",
        text: "Bank transfer, no card, no stress, and the receipt lands before I close my banking app. That is why I have kept giving through AzarFaith for two years.",
        by: "Sani, giver, Kano",
      },
      {
        type: "p",
        text: "If you have a story about giving through AzarFaith, send it to support@azarfaith.ng and we may feature it here.",
      },
    ],
    cta: {
      heading: "Start your own story",
      text: "Find a verified church, mission, orphanage or faith-based school and give in Naira today.",
      primary: { label: "Explore campaigns", to: "/explore" },
      secondary: { label: "How verification works", to: "/verification" },
    },
  },
];
