import type { PageDoc } from "@/components/pages/types";

export const givingPages: PageDoc[] = [
  {
    slug: "give-once",
    eyebrow: "Ways to give",
    title: "Give once",
    lead: "Send a single gift to a church, missionary, orphanage, or faith-based school the moment the need appears. Card, bank transfer, and USSD all settle in naira, with a receipt issued for every donation.",
    template: "guide",
    blocks: [
      {
        type: "h2",
        text: "When one gift is the right answer",
        id: "when-one-gift-is-right",
      },
      {
        type: "p",
        text: "Some needs do not wait for a budget cycle: a roof leak before the rains, a family arranging a funeral, a mission trip with a shortfall, or a famine appeal that closes on Friday. A one-off gift on AzarFaith moves the amount you choose to the recipient's account, less only the default platform fee of 2.5%, and settles within 2–5 working days after verification.",
      },
      {
        type: "p",
        text: "One-off gifts also suit givers who prefer not to commit to a schedule. You choose the amount, choose the cause, and keep full control: nothing repeats, nothing auto-renews, and nothing needs cancelling later.",
      },
      {
        type: "steps",
        items: [
          "Open the ministry's page on AzarFaith and pick the campaign or fund you want to support.",
          "Enter a naira amount, then pay by card, bank transfer, or USSD — or reuse a saved payment method for a faster checkout.",
          "Confirm the gift. Your receipt is issued immediately and stored in My giving.",
          "The ministry receives settlement within 2–5 working days after verification, and you can follow the gift's status from the same page.",
        ],
      },
      {
        type: "bullets",
        items: [
          "Building and repair funds: roofing sheeting, water tanks, boreholes, and classroom blocks.",
          "Funeral and medical collections for a member of your church or community.",
          "Famine and flood relief where a public appeal has a fixed closing date.",
          "Wedding, dedication, and anniversary gifts given to a ministry rather than an individual.",
          "One-off mission support when a missionary's trip is funded in stages.",
          "Festival provision drives: food parcels at Christmas and Easter for families the church knows.",
        ],
      },
      {
        type: "callout",
        title: "What a one-off gift costs",
        text: "AzarFaith's default platform fee is 2.5% per donation, shown before you confirm. Receipts are issued for every donation, whether you give once or on a schedule, and every receipt stays in My giving.",
      },
      {
        type: "faq",
        items: [
          {
            q: "Does a one-off gift renew on its own?",
            a: "No. A one-off gift is a single transaction. Nothing is saved as a schedule, and no further amount is ever taken from your card, bank account, or USSD limit.",
          },
          {
            q: "Can I use a saved payment method?",
            a: "Yes. Card and bank details saved on AzarFaith can be reused at checkout, and USSD remains available if you prefer to approve the payment from your phone.",
          },
          {
            q: "When does the ministry actually receive the money?",
            a: "Settlement typically completes within 2–5 working days after verification of the recipient's account. The status of your gift updates in My giving as it moves through.",
          },
          {
            q: "What if I enter the wrong amount?",
            a: "Write to support@azarfaith.ng with your receipt reference before settlement completes. The team will confirm what can be adjusted or refunded under the platform's refund policy.",
          },
        ],
      },
    ],
  },
  {
    slug: "monthly-support",
    eyebrow: "Ways to give",
    title: "Monthly support",
    lead: "Commit a fixed naira amount each month to one church, orphanage, or missionary and receive an impact update alongside every receipt, so you always know what your partnership is funding.",
    template: "guide",
    blocks: [
      {
        type: "h2",
        text: "What steady support changes",
        id: "what-steady-support-changes",
      },
      {
        type: "p",
        text: "Ministries plan salaries, food purchases, and utility bills from predictable income. When your gift arrives on the same date each month, an orphanage director can buy in bulk, a pastor can plan a youth worker's stipend, and a faith-based school can commit to a term's feeding programme without guessing at next month's balance.",
      },
      {
        type: "steps",
        items: [
          "Choose the church, orphanage, or missionary you want to partner with and open their monthly support option.",
          "Set a naira amount and a billing date — many givers pick the day after payday.",
          "Pay by card, bank transfer, USSD, or a saved payment method; the same method is charged on each date.",
          "Receive your receipt and a short update each month, and change anything from My giving.",
        ],
      },
      {
        type: "bullets",
        items: [
          "A receipt for every donation, filed under My giving for records and year-end reviews.",
          "A short monthly impact note from the ministry: enrolment numbers, meals served, repairs completed.",
          "A running total showing what you have given since the partnership began.",
          "Advance notice of any change to the 2.5% platform fee or to the billing date you chose.",
          "The freedom to pause or cancel recurring support from My giving at any time.",
          "An annual summary listing every naira given to that ministry across the twelve months.",
          "Payment by card, bank transfer, USSD, or a saved payment method on each billing date.",
          "A direct reply from the ministry to questions sent through the platform's message thread.",
        ],
      },
      {
        type: "quote",
        text: "When the giving is predictable, the planning is too. We stopped guessing which month the feeding programme could start.",
        by: "a coordinator at a partner faith-based school",
      },
      {
        type: "p",
        text: "Monthly support is a partnership, not a subscription. AzarFaith does not promise outcomes on a ministry's behalf — you are giving an organisation room to plan, and the update you receive each month shows how the funds were used. If your own circumstances change, reduce the amount, skip a month, or end the schedule in My giving; the ministry is told nothing until you decide.",
      },
    ],
  },
  {
    slug: "emergency-appeals",
    eyebrow: "Ways to give",
    title: "Emergency appeals",
    lead: "Emergency appeals fund a flood, a medical bill, a fire, or an eviction notice against a public deadline. Gifts made before the closing time are batched for faster verification and payout.",
    template: "guide",
    blocks: [
      {
        type: "h2",
        text: "How fast funding works",
        id: "how-fast-funding-works",
      },
      {
        type: "p",
        text: "An emergency appeal on AzarFaith carries a target amount, a closing time, and a recipient holding a verified badge. Gifts are collected continuously and batched for verification so funds reach the ministry faster than a standard campaign; settlement typically completes within 2–5 working days after verification, and most appeals display a live countdown so givers can see exactly how long remains.",
      },
      {
        type: "steps",
        items: [
          "Check the target, deadline, and verified badge before you give — urgency should never replace due diligence.",
          "Give by card, bank transfer, or USSD; on busy appeals a saved payment method is the quickest route through checkout.",
          "Watch the progress bar update as gifts are counted toward the target.",
          "Track settlement from My giving and keep the receipt issued for every donation.",
        ],
      },
      {
        type: "bullets",
        items: [
          "Flood and storm damage: roof sheeting, bedding, and clean water for displaced families.",
          "Medical emergencies supported by a hospital's written bill and a stated admission date.",
          "Eviction and rent shortfalls where a family faces a fixed court or landlord date.",
          "Market or church building fires needing immediate replacement of fittings and equipment.",
          "Funeral costs for a household that has just lost its main income earner.",
          "Emergency transport and lodging when a community must relocate on short notice.",
          "School fees at risk of withdrawal when a guardian loses work mid-term.",
        ],
      },
      {
        type: "callout",
        title: "Deadlines are real",
        text: "Appeals close at the time shown on the page. Gifts arriving after the deadline may be held for the next appeal or returned, so confirm the closing time first. If you are unsure whether your gift landed in time, write to support@azarfaith.ng with your receipt reference.",
      },
      {
        type: "p",
        text: "Appeals also list which items remain unfunded — the second borehole, the remaining bed spaces — so you can give toward a specific gap rather than a general pool. Recipients pass verification before any payout is released, the itemised list is updated as commitments are confirmed, and if an appeal closes short of its target the shortfall is reported on the page rather than quietly absorbed.",
      },
    ],
  },
  {
    slug: "recurring",
    eyebrow: "Ways to give",
    title: "Recurring giving",
    lead: "Recurring giving is the mechanic behind every schedule on AzarFaith: pick a frequency, save a payment method, and manage pause, cancel, and receipts yourself from My giving without writing to anyone.",
    template: "guide",
    blocks: [
      {
        type: "h2",
        text: "Frequency, methods, and control",
        id: "frequency-methods-control",
      },
      {
        type: "p",
        text: "Recurring giving covers weekly, fortnightly, monthly, and quarterly schedules. You choose the amount and the date, attach a card, bank transfer, or saved payment method, and AzarFaith charges the same naira amount each cycle. Every charge produces a receipt, and every schedule stays under your control on a single screen.",
      },
      {
        type: "steps",
        items: [
          "Start a schedule from any ministry page and choose weekly, fortnightly, monthly, or quarterly.",
          "Enter the naira amount, pick the date, and attach a card, bank transfer, or saved payment method.",
          "Confirm once; later cycles charge automatically and each one issues a receipt.",
          "Pause, resume, or cancel from My giving at any time — changes apply to the next cycle, not retroactively.",
        ],
      },
      {
        type: "h2",
        text: "Recurring versus monthly support",
        id: "recurring-versus-monthly",
      },
      {
        type: "p",
        text: "Monthly support describes the partnership: a steady relationship with one church, orphanage, or missionary. Recurring describes the machinery underneath it — the frequency, the saved method, and the controls. You can run a recurring gift weekly to three different ministries, or hold a monthly partnership with one; the two overlap, but the labels answer different questions.",
      },
      {
        type: "bullets",
        items: [
          "Frequencies: weekly, fortnightly, monthly, quarterly — changeable without cancelling.",
          "Pause for a month when payday lands differently, then resume with no re-entry of details.",
          "Cancel from My giving at any time; the schedule stops before the next charge runs.",
          "A failed payment retries once, then the schedule pauses and notifies you.",
          "Saved payment methods can be replaced or removed without ending the schedule.",
          "The 2.5% platform fee is shown per cycle before you confirm the first one.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "Is recurring the same as monthly support?",
            a: "Not quite. Monthly support is the partnership you hold with one ministry; recurring is the setting that runs any frequency you pick — weekly, fortnightly, monthly, or quarterly — on a saved payment method.",
          },
          {
            q: "How do I pause without losing my history?",
            a: "Open My giving, select the schedule, and choose pause. Your giving history and receipts stay in place, and resuming uses the same amount and date.",
          },
          {
            q: "What happens if my card expires?",
            a: "The cycle fails once, AzarFaith notifies you, and the schedule pauses rather than guessing. Update the saved payment method in My giving to restart it.",
          },
          {
            q: "When is the platform fee charged?",
            a: "The default 2.5% fee is applied to each donation, shown before the first cycle and itemised in every receipt afterwards.",
          },
        ],
      },
    ],
  },
  {
    slug: "team-giving",
    eyebrow: "Ways to give",
    title: "Team giving",
    lead: "Families, small groups, church departments, and offices pool gifts toward one shared target, with a live progress bar, an optional leaderboard, and a separate receipt for every member.",
    template: "guide",
    blocks: [
      {
        type: "h2",
        text: "Set a shared goal",
        id: "set-a-shared-goal",
      },
      {
        type: "p",
        text: "A team pool gives one cause one page. A men's fellowship raising ₦1,800,000 for a hall renovation, a youth department covering a camp, or a family funding a relative's surgery can invite members, watch a single progress bar climb, and compare contributions on a leaderboard that stays optional — teams can hide it if competition does not suit them.",
      },
      {
        type: "steps",
        items: [
          "A team lead creates the pool, sets the naira target and deadline, and names the ministry or fund receiving the money.",
          "Members join by link and give by card, bank transfer, USSD, or a saved payment method.",
          "The progress bar updates in real time; the leaderboard ranks contributions by amount or by number of gifts.",
          "When the target is met or the deadline passes, funds settle to the recipient within 2–5 working days after verification.",
        ],
      },
      {
        type: "bullets",
        items: [
          "Per-member receipts: each giver receives their own receipt for every donation, independent of the team total.",
          "Role controls: leads edit the target and the deadline, members give and comment.",
          "Milestone markers at 25%, 50%, and 75% keep a long campaign visible.",
          "Optional leaderboard with an anonymous mode for members who prefer privacy.",
          "A weekly summary for the lead showing the pool's total and contributor count.",
          "Pledges: members can promise an amount and pay in instalments before the deadline.",
          "A closing celebration post showing the final total, contributor count, and the receipt batch.",
          "Export of the member list for a church department that reports to a finance committee.",
        ],
      },
      {
        type: "p",
        text: "Team pools suit repeated, communal giving: harvest thanksgivings, departmental levies, condolence collections, and building funds where the whole congregation is asked for a small amount rather than a few givers for a large one.",
      },
      {
        type: "p",
        text: "The pool holds no money of its own. Gifts are recorded against the shared target for display, while each member's naira amount is processed on its own so receipts, the 2.5% platform fee, and settlement stay clean for everyone involved. That also means a member who leaves keeps the receipts for the gifts they already made.",
      },
    ],
  },
  {
    slug: "sponsorship",
    eyebrow: "Ways to give",
    title: "Sponsorship",
    lead: "Sponsorship pairs one giver with one child, school, or ministry for the long term: a fixed monthly gift, termly updates with progress notes, and safeguarding rules that govern every contact.",
    template: "guide",
    blocks: [
      {
        type: "h2",
        text: "What sponsorship commits you to",
        id: "what-sponsorship-commits",
      },
      {
        type: "p",
        text: "Sponsorship is a relationship measured in years, not campaigns. You commit to a fixed naira amount each month toward a child's school fees, a missionary's basic support, or an orphanage's care costs, and the partner organisation reports back on a set rhythm — usually each school term — so you see enrolment, attendance, and completed items rather than general promises.",
      },
      {
        type: "steps",
        items: [
          "Browse verified sponsorship listings and read what the monthly gift covers: fees, meals, uniforms, or a ministry stipend.",
          "Choose an amount and start a recurring schedule with a card, bank transfer, USSD, or a saved payment method.",
          "Receive updates on the published rhythm, typically each term, with a receipt for every donation.",
          "Review, pause, or cancel from My giving at any time; sponsorship ends without a notice period.",
        ],
      },
      {
        type: "bullets",
        items: [
          "Termly written updates naming what the gift paid for, with itemised costs.",
          "Photographs published by the partner organisation only, never passed back as personal contact.",
          "No direct private contact between givers and children; all messages run through the ministry.",
          "Givers receive reference codes, not a child's personal data or home address.",
          "Partners hold a verified badge and re-verify to keep their listing live.",
          "Receipts for every donation, so a year of sponsorship is easy to total.",
          "Mid-year statements listing every cycle charged, its date, and its naira amount.",
          "A choice to sponsor a whole classroom or dormitory when several givers share one placement.",
        ],
      },
      {
        type: "quote",
        text: "We do not sell access to children. A sponsor funds a place at school and receives a report card — that boundary protects everyone.",
        by: "the safeguarding lead at a partner orphanage network",
      },
      {
        type: "p",
        text: "If a child leaves the programme or a placement ends, AzarFaith notifies you before the next cycle so you can redirect the gift, pause, or cancel. Each listing states in advance what happens to funds raised for a placement that no longer exists, and any balance is either applied to the programme you sponsored or held for your instruction.",
      },
    ],
  },
  {
    slug: "matching-gifts",
    eyebrow: "Ways to give",
    title: "Matching gifts",
    lead: "Many employers and some churches match what you give, doubling a ₦50,000 gift to ₦100,000 at no extra cost to you — if you submit the match inside the employer's window with your receipt.",
    template: "guide",
    blocks: [
      {
        type: "h2",
        text: "Checking whether you are eligible",
        id: "checking-eligibility",
      },
      {
        type: "p",
        text: "Matching programmes vary. Some employers match any registered non-profit, some restrict their lists to education, health, or disaster relief, and some cap each employee's annual total. Faith-based organisations qualify under many schemes, but the decision sits with your employer, so start by reading their matching policy and confirming that the ministry you chose is eligible.",
      },
      {
        type: "steps",
        items: [
          "Give as usual on AzarFaith and download the receipt issued for every donation.",
          "Open your employer's matching-gift portal or HR form and search for the recipient ministry.",
          "Enter the receipt reference, donation date, and naira amount, then submit before the match window closes.",
          "Your employer pays the match directly; AzarFaith confirms it and both gifts appear in your impact total.",
        ],
      },
      {
        type: "bullets",
        items: [
          "Match windows typically run 30 to 90 days after the donation date — submit early.",
          "Recurring gifts usually match one cycle at a time, receipt by receipt.",
          "Retiree and board-member matching is common; part-time eligibility varies by employer.",
          "Some churches match from a congregation budget — ask your finance team for the form.",
          "Pair a year-end one-off gift with a match to use up a remaining annual cap.",
          "Keep every receipt: many employers ask for proof within a week of submission.",
        ],
      },
      {
        type: "callout",
        title: "Keep the receipt",
        text: "AzarFaith issues a receipt for every donation with a reference, date, and naira amount — exactly what an employer's form requires. Downloads live in My giving, and support@azarfaith.ng can resend any receipt if the original email went missing.",
      },
      {
        type: "p",
        text: "Matches settle more slowly than ordinary gifts because the employer pays on its own cycle, often monthly. Once confirmed, the match is recorded against your impact total, and the ministry's payout follows the usual 2–5 working days after verification.",
      },
      {
        type: "faq",
        items: [
          {
            q: "Does the match count as my donation?",
            a: "No. Your gift is the naira amount you gave; the match is the employer's separate payment. Both are recorded, but only your original gift generates your receipt.",
          },
          {
            q: "What if my employer rejects the ministry?",
            a: "Some schemes exclude religious activity while still funding the school or orphanage. Redirect the match to an eligible programme on AzarFaith before the window closes.",
          },
          {
            q: "Can I match a recurring gift?",
            a: "Usually one cycle at a time. Submit each cycle's receipt separately, following your employer's annual cap and the 2.5% platform fee shown on that receipt.",
          },
          {
            q: "How long does a match take to appear?",
            a: "Employers pay on their own schedule, often monthly. Once confirmed, the match shows in your impact total and the ministry's settlement follows the standard 2–5 working days after verification.",
          },
        ],
      },
    ],
  },
];
