# Designer Landing Restoration

## Repository Separation

The complete designer repository is cloned locally at
`../azarfaith-design-reference`, outside both the backend and integrated frontend.
Its fetch remote is `https://github.com/mos-ski/azarfaith.git`; its push URL is
deliberately `DISABLED`. Reference commit:
`6c27cda68d4c738b62e9867d7ca7b196ec828d7d`.

The working frontend remains `../azarfaith`, with its existing Zikkieman remote,
staging branch, API client and cookie authentication. The backend remains
`../Azarfaith-BE` and is unchanged by this restoration. This pass is local; it
does not push, deploy, merge unrelated commits or replace either repository.

## Scope And Fidelity

Only the landing screen at `/` is restored in this pass. The original black
website navigation, animated opening and yellow finale, cycling headline,
Nigeria map tour, phone stepper, five-feature panel, photo collage, testimonials,
featured cards, FAQ, closing CTA and complete footer are preserved in their
original order. Components, SVGs, imagery, class expressions, spacing and motion
come from the reference, not a new interpretation of screenshots.

The source uses a variable Google Sans Flex face including optical sizing. It
is isolated as `AzarFaith Landing` to prevent the existing app's weight-only
face from changing the design. Original theme tokens compile with the main
Tailwind stylesheet; custom effects are scoped under `.designer-landing`.
Existing non-landing typography and motion styles are not replaced.

Integration-only changes are real Redux session binding, API reads, valid live
route parameters, explicit display-preview labels, safe sharing, and an honest
message for unavailable newsletter/social integrations. Source reduced-motion
SSR bugs in the opening and collage are fixed without changing their layouts.
No source Zustand authentication, mock payment confirmation, fixed user ID,
simulated transfer or mock mutation is copied into the working application.

Other screens are NOT certified as visually faithful by this pass. Their current
API functionality is preserved. Full footer destination screens will need their
own source-by-source restoration; absent destinations currently show a clearly
labelled preview, not a fabricated finished feature or approved legal policy.

## Live Data And Pending Sources

The user explicitly approved retaining all source design content where real data
is not ready. Display examples are isolated in `design-preview.ts` and map data;
they are never saved or passed into payment/mutation endpoints.

| Area                                                   | Current Source                                               | Remaining Work                                                                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication and dashboard links                     | Real `/auth/session`, Redux role and existing `/auth/logout` | None for landing; donor goes to `/dashboard`, admin to `/admin`                                                                                                           |
| Featured campaigns and campaign showcase               | `/campaigns/discover`, published-only filter                 | Source examples are visibly labelled when the API has no published cards; real IDs open real detail/checkout and share links                                              |
| Organization illustrations                             | `/organizations/discover`, published-only filter             | Display-only source examples when no published organizations; never treated as owned accounts                                                                             |
| Weekly giving headline and state totals                | `/public/giving` actual totals/locations                     | Per-category counts are not supplied; do not assign every organization to church. Unspecified locations stay in overall totals but cannot be assigned to a state          |
| Map donation ticker                                    | Original sample events, marked preview                       | Need a privacy-safe public recent-giving feed before calling this live; never expose donor identity or precise address                                                    |
| Testimonials and impact claims                         | Original designer examples, marked preview                   | Approved quotes, names, permissions, portraits and supporting impact evidence                                                                                             |
| Giver rating and star tiles                            | Source 4.7 rating, explicitly design preview                 | Real rating/review source and aggregation rules                                                                                                                           |
| How-it-works phone and receipt                         | Original educational examples, marked illustrative           | Examples are not a real payment, receipt or personal giving history                                                                                                       |
| Feature-panel history, payout schedule, bank/checklist | Original illustrations, marked preview                       | Not live balances, guaranteed Friday payments, real account suffixes or proof of specific leadership checks                                                               |
| Trust receipt and badges                               | Source design, receipt marked sample                         | PM-approved fee/timing/receipt promises and confirmation of registration claims; current semi-auto payouts must not be presented as guaranteed next-working-day transfers |
| FAQ and marketing copy                                 | Original source copy                                         | Product/policy review of fee, timing and evidence promises before release                                                                                                 |
| Newsletter form                                        | Original layout, email validation, explicit not-saved notice | Subscription endpoint, persistent opt-in, consent/unsubscribe flow and provider integration                                                                               |
| LinkedIn and YouTube                                   | Original icon controls, explicit unavailable notice          | Official URLs; no invented social links                                                                                                                                   |
| Footer resource/product/legal pages                    | Existing real guides, otherwise explicit preview             | Restore actual source screens and approved copy. Team giving, sponsorship and matching gifts are not claimed as working products; legal placeholders are not policies     |

The sample dataset is intentionally limited to public display organizations and
campaigns. No prototype users, accounts, roles, authorization codes, admin stores
or financial mutations are imported. A sample card's Give action leads to
Discover, and copying a sample campaign reports that it is a preview rather than
creating a fake donation URL. Backend errors remain visible and offer retry.

## Verification

Final checks: 68 frontend unit/integration tests, 12 landing browser checks and
6 existing public map/guide browser checks passed. TypeScript and the production
build passed. Targeted ESLint has no errors and three non-blocking fast-refresh
warnings for the shared context/helper exports in `data.tsx`. Browser tests use
isolated API/image fixtures; visual comparisons use the original external imagery.

`tests/fixtures/landing-design.json` records the reference commit, class-expression
hashes for all 14 landing components (map section only), and all seven SVG hashes.
`tests/landing-restoration.test.mjs` protects these source expressions/assets,
section order, state aggregation and preview payment boundaries. Additional
`relative` positioning anchors are allowed for preview annotations; this check
is a structural regression guard, not a pixel-perfect guarantee.

Browser comparisons run against the untouched local reference at port 18220 and
the restored frontend at port 18221, using intercepted API responses only. At
390px, 820px and 1440px, all ten headline boxes match the reference in position,
width and height in reduced-motion/sample mode. At 320px the boxes have matching
horizontal geometry and size; annotation wrapping causes small vertical offsets
(up to 18px). Source versus restored section screenshots were inspected. The
untouched reference itself raises reduced-motion hydration/scroll-target errors;
the restored page does not. This is not a claim that all dynamic frames or every
browser are pixel-identical.

`tests/browser/landing-restoration.mjs` covers 320/390/820/1440px layout overflow,
original section presence, FAQ, mobile login navigation, actual aggregate fixtures,
published-only cards, real checkout/detail/share URLs, sample checkout exclusion,
giving outage recovery, newsletter/social notices, donor/admin session routing,
logout and normal-motion mounting. No real donation, email or database mutation
is made by these fixture tests. Existing map/guide checks remain separate.

Keep each subsequent screen in a separate reviewable pass: identify its pinned
source files, compare the original and restored screen locally, bind real APIs,
inventory missing data, run regression/browser checks, then report that specific
screen's status. Do not describe the entire visual migration as complete based
only on endpoint or functional tests.
