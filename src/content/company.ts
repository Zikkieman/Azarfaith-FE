import type { PageDoc } from "@/components/pages/types";

export const companyPages: PageDoc[] = [
  {
    slug: "about",
    eyebrow: "Company",
    title: "About AzarFaith",
    lead: "AzarFaith is a Nigerian giving platform where every naira can be traced from giver to verified ministry. This is the story of why we built it, what the verified badge actually stands for, and where the platform sits today.",
    template: "handbook",
    blocks: [
      { type: "h2", text: "The problem we set out to fix" },
      {
        type: "p",
        text: "For years, giving in Nigeria has run on cash envelopes, forwarded bank alerts and screenshots that nobody can independently check. A giver rarely learns whether a donation arrived, what it paid for or who authorised the payout, and organizations rebuild the same proof from scratch for every supporter who asks. The cost of that opacity is not abstract: worthy appeals go unfunded because nobody can confirm them, while honest ministries lose support they never knew had quietly stopped. AzarFaith exists to change that. Our mission is to make giving between givers and faith-based organizations open, verified and dignified, so that trust is earned by evidence rather than familiarity. The platform is built in Nigeria, for Nigerian givers, and every feature starts from that reality: Naira amounts, local bank transfers, church treasurers working on Sundays, and campaigns that must survive an honest audit.",
      },
      { type: "h2", text: "How AzarFaith works in three steps" },
      {
        type: "steps",
        items: [
          "Find a verified organization or campaign. Search by cause, location or category; every listing shows the verified badge, the target and the receiving organization before you commit a naira.",
          "Give in Naira by card or bank transfer. Your donation is recorded against the campaign and you receive a receipt with a reference you can check later, or forward to a treasurer.",
          "Follow the impact. Organizations publish dated, public updates as funds are used, so you can see what your giving paid for without needing a private answer.",
        ],
      },
      { type: "h2", text: "What the verified badge means" },
      {
        type: "p",
        text: "The verified badge is not a logo we sell. Before an organization can publish a campaign, we review its registration or incorporation documents, confirm the identity of the people who lead it, and check that the bank account receiving donations matches the organization's name. We re-check whenever leadership or account details change, and we suspend campaigns that stop meeting the bar. Verification covers the entity, not the promise of a single appeal — that is what campaign updates are for. If an organization cannot pass the checks, it cannot collect through AzarFaith, however well known it may be.",
      },
      { type: "h2", text: "Traction, team and the principles we hold" },
      {
        type: "p",
        text: "Today, ₦35M+ is given weekly through AzarFaith, 480+ verified organizations run campaigns on the platform, and 18,000+ active donors give at least once a month. Those numbers are carried by a small, remote-first team across engineering, verification, operations and support, many of whom have sat on church treasuries or mission boards themselves. The team is deliberately small, and everyone — engineers included — spends time reading support messages from givers, because that is where the platform's real behaviour shows itself. Four principles govern how we work: stewardship before scale, evidence over promises, the giver's money is never our story to tell, and nothing ships if it makes verification weaker. We measure ourselves by receipts issued, payouts settled and questions answered — not by attention.",
      },
      {
        type: "quote",
        text: "We are not trying to make giving fashionable. We are trying to make it accountable — one receipt, one verified organization and one honest update at a time.",
        by: "The AzarFaith team",
      },
    ],
  },
  {
    slug: "manifesto",
    eyebrow: "Company",
    title: "Our manifesto",
    lead: "Nine principles that decide what AzarFaith builds, what we refuse to build, and how we behave when growth and integrity point in different directions. Written for givers, organizations and anyone weighing whether to trust us.",
    template: "handbook",
    blocks: [
      {
        type: "p",
        text: "A giving platform holds other people's trust, so its values cannot be a page nobody reads. These nine principles are the ones we argue from in product meetings, the ones we use to reject features that would make money but weaken faith, and the ones we expect to be judged against in public. They are short on purpose. Each one is written to be testable: if a decision on AzarFaith breaks a principle below, the decision is wrong, no matter how well it performs.",
      },
      { type: "h2", text: "Nine principles" },
      {
        type: "steps",
        items: [
          "Stewardship before scale. Growth that outruns our ability to account for the money is not growth, it is exposure. We would rather settle fewer naira correctly than more naira quickly.",
          "Transparency by default. Campaign targets, funds received and funds used are visible to every giver. If a fact about a donation would embarrass us to publish, we fix the fact, not the page.",
          "Every giver has dignity. The widow giving ₦500 and the donor wiring ₦5M get the same receipt, the same records and the same answer from support. No tier of giver is treated as a smaller person.",
          "No middleman owns the story. Organizations tell their own story in their own words. We provide the verified badge, the records and the rails — we do not sit between a ministry and its supporters and narrate them.",
          "Local churches first. Nigerian churches, missions and orphanages were serving their communities long before software arrived. We build for how they already work, in Naira, with their treasurers and their governance intact.",
          "Evidence over hype. We publish numbers we can defend and product claims we can demonstrate. No countdown timers, no inflated totals, no impact language that a treasurer could not verify with a bank statement.",
          "The safety of children is non-negotiable. Campaigns involving children are held to the strictest verification, no child's full identity is published for appeal purposes, and any safeguarding concern pauses a campaign immediately.",
          "Long-term faithfulness over short-term growth. We optimise for givers who are still here in ten years, organizations that still exist in ten years, and relationships that do not need to be rebuilt after every campaign cycle.",
          "The mission outranks the metric. When a dashboard figure and a principle disagree, the principle wins. Metrics report on the mission; they never redefine it.",
        ],
      },
      { type: "h2", text: "What this looks like on an ordinary week" },
      {
        type: "p",
        text: "Principles only matter when they cost something. In practice they show up as small, unglamorous decisions: we refuse to list an organization that will not share its registration documents; we delay a campaign launch to re-check a changed bank account; we refund a donor whose receipt does not match the campaign record; we answer support messages from givers who never spent a naira. None of these make a good launch announcement. All of them are the reason the verified badge means anything at all.",
      },
      { type: "h2", text: "How we could break these" },
      {
        type: "p",
        text: "We know the failure modes, because the sector has seen them. Pressure to hit a funding number can turn verification into a formality. Pressure to publish impressive totals can turn impact reporting into decoration. Pressure to onboard a famous organization quickly can turn the badge into a marketing asset. We name these risks openly so that givers can hold us to them: if AzarFaith ever ships a dark pattern, inflates a statistic or loosens verification for speed, that is a broken principle, and we expect to be told so.",
      },
      {
        type: "callout",
        title: "Our commitment",
        text: "If we ever break one of these principles, write to hello@azarfaith.ng and say so. We will answer, we will explain what happened, and where we are wrong we will correct it in public on the same pages where we made the claim.",
      },
      {
        type: "quote",
        text: "Faith is not a growth hack. The people giving here are obeying something they believe in, and we treat that as a responsibility before we treat it as an opportunity.",
        by: "The AzarFaith team",
      },
    ],
  },
  {
    slug: "careers",
    eyebrow: "Company",
    title: "Careers",
    lead: "AzarFaith is a small, remote-first team in Nigeria building giving infrastructure for churches, missionaries and faith-based organizations. We hire slowly, pay fairly and write things down — here are the roles open right now and how the process runs.",
    template: "cards",
    blocks: [
      {
        type: "p",
        text: "We are a team of engineers, verification specialists, designers and community people who care about one thing: that every naira given through AzarFaith can be accounted for. Work is remote across Nigeria, decisions are written down, and nobody is rewarded for moving fast on checks that protect givers.",
      },
      { type: "h2", text: "Open roles" },
      {
        type: "cards",
        items: [
          {
            tag: "Engineering",
            meta: "Remote (Nigeria) · Full-time",
            title: "Backend Engineer, Payments",
            text: "Own the Naira collection, settlement and payout services that move money between givers and verified organizations.",
          },
          {
            tag: "Engineering",
            meta: "Remote (Nigeria) · Full-time",
            title: "Mobile Engineer, Donor Experience",
            text: "Build the giving flow that thousands of donors use each month, from first tap to receipt, on uneven networks.",
          },
          {
            tag: "Design",
            meta: "Remote (Nigeria) · Full-time",
            title: "Product Designer",
            text: "Design clear, honest interfaces for givers and church administrators who are trusting us with money they cannot afford to lose.",
          },
          {
            tag: "Operations",
            meta: "Remote (Nigeria) · Full-time",
            title: "Organization Verification Specialist",
            text: "Review registration documents, leadership identity and bank details so the verified badge keeps meaning something.",
          },
          {
            tag: "Growth",
            meta: "Remote (Nigeria) · Full-time",
            title: "Community Lead, Faith Partnerships",
            text: "Work alongside pastors, treasurers and mission boards to bring their organizations onto AzarFaith properly, not just quickly.",
          },
        ],
      },
      { type: "h2", text: "How we hire" },
      {
        type: "steps",
        items: [
          "Apply by email. Send your CV and a short note to careers@azarfaith.ng with the role title in the subject line — we read every application and reply to the ones we move forward.",
          "Intro call, about 30 minutes with the hiring manager on the role, the salary range and how the team works day to day.",
          "A small, paid practical exercise based on real work from the team, taken at your own pace within a week.",
          "Two team conversations and a written decision within seven days of the final call, whether the answer is yes or no.",
        ],
      },
      {
        type: "p",
        text: "Benefits include a competitive Naira salary reviewed annually, full-time remote work with a home-office and data allowance, 24 days of annual leave, health cover for you and your dependants, and one gathering each year in Lagos where the whole team meets in person. We also protect focused working hours — no standups after 10:00 WAT and no expectations of weekend messaging.",
      },
    ],
  },
  {
    slug: "press",
    eyebrow: "Company",
    title: "Press",
    lead: "Background, product facts and brand assets for journalists covering faith, philanthropy and payments in Nigeria. For interviews, founder commentary or data requests, reach press@azarfaith.ng and we respond within two working days.",
    template: "cards",
    blocks: [
      {
        type: "p",
        text: "AzarFaith is a Nigerian faith-based giving platform where verified churches, missions, orphanages and ministries receive Naira donations from individual givers. We can provide platform statistics, product screenshots, founder commentary and background on how verification works. Please include your deadline and publication in your first message so we can route it correctly.",
      },
      { type: "h2", text: "In the news" },
      {
        type: "cards",
        items: [
          {
            meta: "Faith & society · 2026",
            title: "Why Nigerian givers are moving from cash envelopes to verified accounts",
            text: "A look at how Naira receipts and public campaign records are changing what congregations expect from an appeal.",
          },
          {
            meta: "Payments beat · 2026",
            title: "The quiet rebuild of charity rails in Naira",
            text: "How local settlement and payout infrastructure is reshaping the way faith-based organizations handle donations.",
          },
          {
            meta: "Church leadership · 2026",
            title: "What verification actually checks before a campaign goes live",
            text: "A walkthrough of document review, leadership identity checks and matching bank accounts behind the verified badge.",
          },
          {
            meta: "Philanthropy round-up · 2026",
            title: "Small gifts, big trail: following ₦35M in weekly giving",
            text: "Reporting on what platform-level totals reveal about generosity, accountability and trust among Nigerian donors.",
          },
        ],
      },
      { type: "h2", text: "Press kit" },
      {
        type: "bullets",
        items: [
          "Logo files — the AzarFaith wordmark and symbol in SVG and PNG, on light and dark backgrounds, with clear-space guidance.",
          "Brand colours — full palette with hex values, typography and rules for correct use in print and on screen.",
          "Founder bio — short and long versions with a portrait, covering the background in faith-based work and payments.",
          "Product screenshots — campaign pages, the verified badge, receipts and campaign updates, cleared for editorial use.",
        ],
      },
      {
        type: "p",
        text: "Request anything above, or an interview, by emailing press@azarfaith.ng with your outlet and deadline in the subject line. We do not charge for brand assets, and we will tell you plainly if a figure or claim cannot be substantiated before you publish it.",
      },
    ],
  },
  {
    slug: "blog",
    eyebrow: "Resources",
    title: "Blog",
    lead: "Field notes from the AzarFaith team on stewardship, product decisions and stories from the organizations we work with — written for givers who want to know what their money actually does, not only where it went.",
    template: "cards",
    blocks: [
      {
        type: "p",
        text: "We write here when we have learned something worth passing on: how a campaign was funded, why a product decision was made, or what givers should ask before they give. No growth hacks, no filler — if a post cannot help you steward money better, it does not get published.",
      },
      { type: "h2", text: "Latest" },
      {
        type: "cards",
        items: [
          {
            tag: "Stewardship",
            meta: "6 min read · Oct 2026",
            title: "What stewardship looks like when the money is digital",
            text: "Three habits that translate ancient ideas about faithfulness into bank alerts, receipts and public campaign records.",
          },
          {
            tag: "Product",
            meta: "4 min read · Oct 2026",
            title: "Campaign receipts you can forward to your congregation",
            text: "Why we rebuilt receipts so a treasurer can attach them to a monthly report without a single follow-up email.",
          },
          {
            tag: "Stories",
            meta: "7 min read · Sep 2026",
            title: "How a parish in Enugu funded a borehole in eleven days",
            text: "Two hundred givers, one verified church account and a string of updates that kept the giving going until the target closed.",
          },
          {
            tag: "Stewardship",
            meta: "5 min read · Sep 2026",
            title: "Five questions to ask before you answer a WhatsApp appeal",
            text: "A short checklist for givers who receive forwarded campaign links and want to know who is actually holding the money.",
          },
          {
            tag: "Product",
            meta: "4 min read · Aug 2026",
            title: "Why we re-verify an organization when its bank details change",
            text: "The story behind a quiet safeguard that pauses campaigns until a new receiving account is confirmed by name.",
          },
          {
            tag: "Stories",
            meta: "6 min read · Aug 2026",
            title: "The treasurer who moved her church off spreadsheets",
            text: "What changed when a decade of manual donation records became receipts givers could search for themselves.",
          },
        ],
      },
      { type: "h2", text: "Newsletter" },
      {
        type: "p",
        text: "One email a month: new posts, one campaign worth watching and a short note from the team on what we are building next. No fundraising asks, no sharing your address, and one-click unsubscribe in every send — subscribe from any page or email hello@azarfaith.ng with the word newsletter.",
      },
    ],
  },
  {
    slug: "guides",
    eyebrow: "Resources",
    title: "Guides",
    lead: "Step-by-step guides for giving wisely on AzarFaith and for faith-based organizations running their first verified campaign, written for the Naira, local bank transfers and verification documents that actually apply in Nigeria.",
    template: "cards",
    blocks: [
      {
        type: "p",
        text: "Each guide is written to be used with the platform open in the next tab — short, specific and honest about what takes time. Givers start with the first set; organizations preparing to collect donations should begin with verification.",
      },
      { type: "h2", text: "For givers" },
      {
        type: "cards",
        items: [
          {
            title: "How to read a verified badge",
            meta: "4 min read",
            text: "What we check before the badge appears, what it does not cover, and the three details to confirm on any campaign page.",
          },
          {
            title: "Giving from outside Nigeria",
            meta: "5 min read",
            text: "How Naira donations, exchange handling and receipts work when you are supporting a ministry from abroad.",
          },
          {
            title: "Setting up a monthly giving plan",
            meta: "3 min read",
            text: "Choose an organization, set an amount and schedule, and keep every receipt in one place for your own records.",
          },
        ],
      },
      { type: "h2", text: "For organizations" },
      {
        type: "cards",
        items: [
          {
            title: "Getting verified: documents and timelines",
            meta: "7 min read",
            text: "The exact documents we ask for, who should be named on them, and how long review usually takes once everything arrives.",
          },
          {
            title: "Publishing your first campaign",
            meta: "6 min read",
            text: "Writing a target, a budget and an update schedule that givers can follow from first gift to final report.",
          },
          {
            title: "Writing updates donors actually read",
            meta: "5 min read",
            text: "A simple structure for campaign updates: what came in, what was bought, what happens next.",
          },
        ],
      },
    ],
  },
  {
    slug: "help-center",
    eyebrow: "Support",
    title: "Help centre",
    lead: "Answers to the questions our support team hears most about accounts, donations, receipts, payouts and verification — plus the quickest way to reach a person when your question is not listed here.",
    template: "guide",
    blocks: [
      {
        type: "p",
        text: "Everything below applies to givers and to administrators of verified organizations using AzarFaith. If you are reporting a problem with a specific donation or payout, include the receipt reference in your message so we can find it on the first try.",
      },
      {
        type: "bullets",
        items: [
          "Problems with a donation or receipt — send the reference number and the date you gave.",
          "Issues with a campaign or an organization — send the campaign link and what you observed.",
          "Access problems — tell us the email address on the account and we will verify identity before restoring anything.",
        ],
      },
      { type: "h2", text: "Frequently asked questions" },
      {
        type: "faq",
        items: [
          {
            q: "How do I create an account, and do I need one to give?",
            a: "You can give with just an email address and your payment details — an account is optional for donors and only needed if you want saved receipts, giving history or a monthly plan. Creating one takes a minute from any campaign page, and we send a confirmation link to verify your email before you can change settings.",
          },
          {
            q: "How do I make a donation, and can I stop a recurring gift?",
            a: "Open a verified campaign, enter an amount in Naira and pay by card or bank transfer; the donation is recorded against the campaign the moment it clears. Monthly giving plans can be paused or cancelled from your account at any time, and the change applies before the next scheduled date — no email or phone call required.",
          },
          {
            q: "Where do I find my receipt?",
            a: "Every successful donation generates a receipt with a unique reference, emailed to you immediately and stored under giving history in your account. Receipts show the amount, the campaign, the receiving organization and the date, and you can download them as a PDF for your own records or for a treasurer who asks.",
          },
          {
            q: "When does an organization receive the money?",
            a: "Funds are held against the campaign and paid out to the organization's verified bank account on the next settlement cycle once the payout request is approved. Payouts are made in Naira to an account whose name matches the organization on file, and administrators can track every request from their dashboard.",
          },
          {
            q: "How does an organization get verified?",
            a: "An organization submits registration or incorporation documents, identification for the leaders authorised to act for it, and a bank account in the organization's name. We review the submission, confirm the details and issue the verified badge once everything matches; re-verification is required whenever leadership or bank details change. The full checklist is in the Getting verified guide in our Guides section.",
          },
          {
            q: "How do I delete my account?",
            a: "Send a deletion request from the email address on the account to support@azarfaith.ng. We remove your personal profile and marketing data, keep only the transaction records we are required to hold for financial reporting, and confirm in writing once the deletion is complete.",
          },
        ],
      },
      { type: "h2", text: "Still need us" },
      {
        type: "p",
        text: "If your question is not covered above, write to support@azarfaith.ng with your email address and any reference number involved. We answer every message in the order received, seven days a week, and we will tell you plainly if something needs investigation rather than leaving you waiting.",
      },
    ],
  },
  {
    slug: "events",
    eyebrow: "Resources",
    title: "Events",
    lead: "Webinars, workshops and community gatherings where givers, church leaders and organization administrators meet the AzarFaith team. Sessions are free, run in English, and recordings are published here within a week of each event.",
    template: "cards",
    blocks: [
      {
        type: "p",
        text: "Everything we run is built around a practical question — how to read a campaign, how to pass verification, how to write an update people trust. Sessions are capped so questions get answered, and you do not need a funded account to attend.",
      },
      { type: "h2", text: "Upcoming" },
      {
        type: "cards",
        items: [
          {
            tag: "Webinar",
            meta: "21 Oct 2026 · 18:00 WAT",
            title: "Reading a campaign before you give",
            text: "A 45-minute walkthrough of the five details on a campaign page that tell you who is holding the money and what for.",
          },
          {
            tag: "Workshop",
            meta: "4 Nov 2026 · 10:00 WAT",
            title: "Verification clinic for church administrators",
            text: "Bring your documents live and work through the checklist with our verification team, with answers on the spot.",
          },
          {
            tag: "Community",
            meta: "18 Nov 2026 · 17:30 WAT",
            title: "Givers' forum: asking better questions",
            text: "An open conversation with donors about stewardship, receipts and what to do when an appeal does not add up.",
          },
          {
            tag: "Webinar",
            meta: "2 Dec 2026 · 18:00 WAT",
            title: "Year-end giving and receipts for treasurers",
            text: "How to close the year cleanly: monthly statements, receipt bundles and reporting totals to your governing board.",
          },
        ],
      },
      { type: "h2", text: "Past events" },
      {
        type: "cards",
        items: [
          {
            tag: "Community",
            meta: "9 Sep 2026 · 18:00 WAT",
            title: "Impact stories from Q3 campaigns",
            text: "Four organizations walked through what they raised, what they bought and what they would do differently.",
          },
          {
            tag: "Workshop",
            meta: "12 Aug 2026 · 10:00 WAT",
            title: "Setting up payout accounts for ministries",
            text: "A practical session on matching bank details, payout schedules and who on a team should hold approval rights.",
          },
        ],
      },
    ],
  },
  {
    slug: "organizations",
    eyebrow: "Discover",
    title: "Verified organizations",
    lead: "Browse faith-based organizations that cleared AzarFaith's verification checks — registration documents, leadership identity and a matching receiving bank account — before they could accept a single donation on the platform.",
    template: "directory",
    blocks: [
      {
        type: "p",
        text: "Every organization listed here carries the verified badge and can publish campaigns in its own name. Names, categories and locations are shown as the organizations present themselves; always read the current campaign page for the latest target, updates and payout activity before you give.",
      },
      { type: "h2", text: "Verified" },
      {
        type: "cards",
        items: [
          {
            tag: "Church",
            meta: "Lagos · Worship & welfare",
            title: "Graceland Chapel",
            text: "A metropolitan parish running Sunday services alongside a food bank and weekly welfare visits across its local community.",
          },
          {
            tag: "Orphanage",
            meta: "Ibadan · Child welfare",
            title: "New Hope Children's Home",
            text: "A residential home caring for children between placement and reunification, funding feeding, schooling and medical care.",
          },
          {
            tag: "Church",
            meta: "Abuja · Community outreach",
            title: "Living Seed Chapel",
            text: "A congregation whose outreach arm supports skills training for young adults and monthly relief for neighbouring households.",
          },
          {
            tag: "Mission",
            meta: "Jos · Rural evangelism",
            title: "Emmanuel Mission Trust",
            text: "A mission society planting and supporting congregations in rural communities alongside literacy and clean water projects.",
          },
          {
            tag: "School",
            meta: "Port Harcourt · Education",
            title: "Cornerstone Faith Academy",
            text: "A fee-assisted school providing primary and junior secondary education with scholarships funded by supporters and alumni.",
          },
          {
            tag: "Ministry",
            meta: "Benin City · Youth ministry",
            title: "Waterside Ministry",
            text: "A youth-focused ministry running mentorship circles, campus fellowships and vocational workshops for teenagers and students.",
          },
        ],
      },
      {
        type: "p",
        text: "To join the directory, an organization applies from its own page on AzarFaith and submits registration or incorporation documents, identification for its authorised leaders and a bank account in the organization's name. Our verification team reviews the submission, confirms each detail and issues the badge; the full checklist, including re-verification triggers, is set out in the Getting verified guide in our Guides section.",
      },
      {
        type: "bullets",
        items: [
          "Churches and parishes — congregations collecting for building, welfare and community work.",
          "Missions and missionary societies — organisations supporting evangelism and rural outreach.",
          "Orphanages and child welfare homes — residential and day care programmes for children.",
          "Schools and faith-based education — nurseries, primary and secondary institutions with assisted places.",
          "Ministries and fellowships — youth, women's and campus groups with a formal organisational structure.",
        ],
      },
    ],
  },
  {
    slug: "campaign-updates",
    eyebrow: "Discover",
    title: "Latest campaign updates",
    lead: "Short, dated updates published by verified organizations after funds move — what was raised, what was bought and what happened next. Every update belongs to a live campaign and is visible to the givers who supported it.",
    template: "cards",
    blocks: [
      {
        type: "p",
        text: "Updates are written by the organizations themselves and posted straight to their campaign pages, so donors see progress without waiting for a private reply. Browse the most recent below, or open a campaign to follow the full record from first gift to final report.",
      },
      { type: "h2", text: "Recently published" },
      {
        type: "cards",
        items: [
          {
            tag: "Church",
            meta: "Church · Enugu · 2 days ago",
            title: "Parish borehole completed and handed over",
            text: "Gifts from 214 donors paid for drilling, plumbing and a solar pump, and the community took possession on Sunday.",
          },
          {
            tag: "Orphanage",
            meta: "Orphanage · Ibadan · 4 days ago",
            title: "School fees covered for 38 children",
            text: "The campaign closed at ₦2.9M and receipts for every payment have been attached to the update for supporters to check.",
          },
          {
            tag: "Mission",
            meta: "Mission · Jos · 6 days ago",
            title: "Medical outreach treated 410 patients",
            text: "A two-day clinic covered consultations, malaria treatment and referrals, with the remaining balance carried to the next outreach.",
          },
          {
            tag: "School",
            meta: "School · Port Harcourt · 1 week ago",
            title: "Two new classrooms opened at the junior block",
            text: "Desks, boards and ceiling fans were purchased from the ₦4.1M raised, and term began in the rooms on schedule.",
          },
          {
            tag: "Ministry",
            meta: "Ministry · Lagos · 1 week ago",
            title: "Youth retreat reached its ₦2.4M target",
            text: "Transport, accommodation and materials are fully funded, and an itemised budget has been posted for every giver.",
          },
          {
            tag: "Church",
            meta: "Church · Abuja · 2 weeks ago",
            title: "Roof repairs finished ahead of the rains",
            text: "Contractor invoices and photographs were published in the update after ₦3.6M in gifts settled to the church account.",
          },
        ],
      },
      { type: "h2", text: "Stay in the loop" },
      {
        type: "p",
        text: "Subscribe to the monthly newsletter to get a short round-up of newly published updates, one campaign worth watching and a note from the team on what we are building next. One email a month, no fundraising asks, and one-click unsubscribe — you can also follow any organization from its directory page to see its updates as they post.",
      },
    ],
  },
];
