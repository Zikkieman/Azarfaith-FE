# Source-Faithful App Restoration

Reference: the complete, unchanged local clone of `mos-ski/azarfaith`, commit
`6c27cda68d4c738b62e9867d7ca7b196ec828d7d`. The working frontend stays in
`azarfaith`; no frontend is introduced in the backend repo.

## Actual Navigation

The reference's signed-in navigation is **Discover → My giving → Manage**.
Manage points to `/dashboard`. Start a campaign points to `/create`. The account
menu contains Profile, My giving, Register your org, Admin when eligible, and
Log out. There is no separate `/manage` page in the reference.

Public navigation: How it works, Ways to give, For organizations, Trust & safety,
About, and auth/dashboard entry controls. See the completed landing/auth passes.

## Completed In This Pass

- `/dashboard`: reference eight-step quick-start accordion, learning sidebar,
  organization desk, four-stat strip, campaign rows, recent gifts, and payout/to-do
  sidebar. Reference app kit, spacing, typography, colors, breakpoints and controls
  are retained. The source has no marketing footer on app screens.
- `/discover`: source six quick views, eight cause-icon tabs, featured carousel,
  urgent/nearly/regular shelves, organization rows/cards, filtered results, and
  source campaign cards. URL `view`, `cause`, `q` links now work. Search, sorting,
  and pagination use the actual discovery APIs, not a downloaded prototype catalog.
- Scoped `AppShell`, `AppNav`, skeletons and original app effects. Other screens
  remain unchanged until individually migrated; this is not a claim of full parity.
- `/my-giving`: source page header, four-stat strip, Regular gifts/History tabs,
  recurring cards, stopped list, receipt table and original dialog styling.
- Additional `/manage` and `/manage/org/$id` routes now use the same source app
  frame, header, buttons, status tags, dashboard panels/list rows and metric-strip
  styling instead of the earlier workspace shell.

## Additional Manage Routes

The designer has no separate `/manage` or `/manage/org/$id` screen. These existing
functional routes are retained as additional owner tools, composed from the pinned
source's app kit and dashboard Panel recipe. This is not a claim that those entire
pages were copied from source files that do not exist. Navbar Manage still points
to the original designer `/dashboard`; the account menu opens the all-causes workspace.

- `/manage` retains real profile, organization-draft and campaign-draft requests,
  user-scoped caches, authentication, independent loading/error/retry states,
  creation links, owner previews and continuation links with the saved draft IDs.
- Long cause names have their own space above wrapping action rows. Approved
  public records retain real Copy link and WhatsApp links. Pending, rejected and
  nonpublic campaigns do not expose sharing controls or fictional public status.
- Organization management uses its existing scoped dashboard endpoint, not the
  workspace list queries. It retains all six real metrics, campaign progress,
  last-gift dates, recent gifts, anonymous donor names, review/reapplication data,
  real organization notices and payout settings. Missing records still return 404.
- Organization payout styling is opt-in. Profile styling remains unchanged.
  Profile-account inheritance, separate organization destinations, bank resolution,
  manual pending verification, masked account details and fee-adjusted balances
  retain their existing APIs and rules. This change does not release any payouts.
- `tests/manage-restoration.test.mjs` checks the source recipes and live integration
  boundaries; `tests/browser/manage-restoration.mjs` covers both routes at four
  widths, navigation, sharing, drafts, retries, owner gates and scoped payout writes.
  Screenshots: `/private/tmp/azarfaith-manage-qa`. No new endpoints or DB changes.

## My Giving Integration

The navbar already linked to `/my-giving`; that destination still used the earlier
adapted workspace. It now uses the original source app frame and page hierarchy.
Real cookie authentication, user-scoped queries and existing endpoints remain.

- Paused gifts remain visible even when the backend sets `active: false`.
  Pause, resume, skip, amount/frequency edits, cancellation and card changes call
  the real endpoints. Version checks, automatic-charge consent, pending-payment
  restrictions, duplicate-action locks and API errors are preserved.
- Metrics use successful payments, actual dates and current-year totals. Existing
  lifetime/monthly totals and supported-cause counts occupy source note slots.
  These notes add height on mobile compared with the prototype's sample metrics.
  Overdue, processing and missed-payment states are not presented as future gifts.
- Fee/pledge disclosures and card changes remain on cards. Existing preferred-card
  and card-removal controls remain in `/profile#payments`, not a fabricated source
  section. Cancellation preserves the optional reason and real Pause instead action.
- History uses the source five-column table. Existing search, date/status/type
  filters, CSV and pagination remain available in a secondary disclosure.
- Individual and combined receipts fetch private donation details, validate record
  identity and successful status, and escape receipt content. Combined downloads
  use bounded requests and abort on errors; no sample or partial receipts are issued.
  Unmounted views cannot trigger late downloads.
- `tests/fixtures/giving-design.json` retains 61 of 64 original page style
  expressions and all original dialog expressions. Exceptions add safe dialog
  scrolling, real action conditions and functional campaign links.
- `tests/giving-restoration.test.mjs` and `tests/giving.test.mjs` cover source
  fidelity, live endpoint guards, totals, paused gifts and safe combined receipts.
  `tests/browser/giving-restoration.mjs` exercises layout/navigation and real API
  payloads using isolated fixtures, not live payments or database mutations.
- Source/restored regular, edit and history screenshots at 390/820/1440px are in
  `/private/tmp/azarfaith-giving-comparison`. Additional functional controls and
  metric notes are explicit adaptations, not pixel-perfect claims for all data.

## Actual Manage Parity

The temporary local empty-state preview was removed after visual confirmation.
`/dashboard` again requests its authenticated, organization-scoped endpoint in
development and production. No preview switch, synthetic records or forced-empty
fallback remain; the confirmed design and real loading/error states are retained.

The source's actual Manage screen is `/dashboard`, not the additional `/manage`
workspace. Its organization state previously retained source classes but had
extra stacked selector/payout content that changed the full-screen layout.
Those differences are now corrected, with rendered comparisons rather than
class-expression checks alone.

- Organization switching sits inside the existing identity strip: click the
  organization name. It no longer inserts a row before the original four-stat
  strip. The same menu retains personal/draft scopes and organization-management
  links. Personal/draft-only accounts remain supported beyond the single-org demo.
- The payout sidebar retains the original title, amount, short copy and one
  primary button. Request history and account details live behind its compact
  options menu. Request forms/history use the original source dialog recipe.
  The prototype's automatic Friday payments and immediate-transfer toast are not
  copied: real requests require admin release and preserve retry request IDs.
- Review progress no longer adds an extra action row; management stays reachable
  through the identity menu and header. Actual review flags, bank verification,
  rejection reasons and draft states remain truthful. Approved campaigns under an
  unverified organization say Approved, not Live.
- Relative gift dates and compact-money thresholds/rounding follow the source.
  Amounts, dates, giver counts, anonymous names and verification states still come
  from the real dashboard endpoint. No sample records are imported by the app.
- `tests/browser/dashboard-parity.mjs` compares onboarding, verified and pending
  states at 390/820/1024/1440px against the unchanged local source. All 12 frames
  passed: measured main sections agree within 1px for positions/dimensions, and
  checked typography, colors and radii match. Source/restored screenshots and
  the numeric report are in `/private/tmp/azarfaith-dashboard-parity`.
- These are equivalent-content isolated fixtures, not live-account screenshots.
  Pending campaigns are pending in both fixtures; image responses are equalized.
  Only the reference's developer-only Prototype switch is hidden for comparison.
  The live notification bell, compact scope/payout menus and truthful policy copy
  remain explicit functional differences. Real names/statuses can wrap differently.
  This is not a promise of pixel equality for every live-data or expanded state.

## Functional Integration Exceptions

These are not independent redesigns:

- The live notification bell remains available. Existing `/manage` organizations,
  drafts and management actions remain reachable from the account menu.
- Real users may have multiple organizations and standalone campaigns. A selector
  preserves those scopes; the reference assumed one sample organization. Empty
  new accounts show the original quick start, not invented giving totals.
- Real authentication uses HttpOnly cookie sessions; prototype `af_session`, fake
  auth/store mutations, timers and organization-switch simulation are not copied.
  Logout awaits the server, then routes to `/login`; failed logout retains auth.
- Guest discovery/one-time donations remain possible, as previously requested,
  rather than copying the prototype's blanket signed-in guard. Dashboard remains
  protected. Discovery shows only server-public, verified, non-draft records.
- Payouts retain admin approval, request IDs, retry validation, fee-adjusted available
  balances, and masked bank details. The prototype's Friday automatic-payment
  schedule, fixed account suffix, invented balance and instant-success toast are
  not real platform policy and are not published as promises.
- Thank-you buttons call the real queue endpoint and display failures. The current
  backend supports eligible, non-anonymous registered donors, not guest thank-yous.
- Review progress reads safe owner-scoped admin checklist flags. Document uploads
  do not imply documents were checked. Payout account verification is distinct from
  organizational-name matching; leadership checks do not imply a call happened.
- Real photo counts drive to-do reminders. Original avatar geometry is retained
  with the existing initials fallback instead of broken image icons.
- Empty/loading/error/retry states and pagination are connected to real API states.
  There is no live in-app mock catalog fallback. Legacy one-time discovery URLs
  remain accepted, without adding an invented seventh quick-view control.

## Dashboard API Additions

`GET /me/dashboard` adds `overview.givers`, campaign `givers` and `galleryCount`,
gift `note`, and `reviewProgress.documentsChecked/leadershipChecked`.
All financial queries remain successful-only and authenticated owner-scoped.
Known givers are deduplicated by registered user ID, or normalized guest receipt
email when no user exists. Unidentified legacy gifts still count as gifts, not
invented unique people. Registered and historical guest identities are not merged
by guessing. Identity/email groups stay server-side and are never returned.
Only review-check booleans are exposed, not private notes or reviewer identities.
Existing database fields are used; no migration or database mutation is required.

The frontend tolerates the prior dashboard response until both repos deploy:
without new distinct-giver counts, it labels existing counts **Gifts**, not Givers.
Missing review flags are never inferred as completed.

## Details And Checkout Restoration

- `/campaign/$id`: original title/organizer metadata, photo gallery, story,
  mobile give section/bar, update list, organizer row, encouragement list,
  sticky desktop giving panel and recent-giver notes. No marketing footer.
- `/org/$id`: original photo mosaic, overlapping identity photo, title/facts,
  About card, campaign cards, recent givers, giving sidebar and regular-giver tiers.
- `/donate/$id`: original full-height two-column checkout, numbered steps,
  selection controls, tip panel, anonymous switch, sidebar summary, mobile total
  and receipt card. Server verification determines confirmation and all amounts.
- These screens use existing campaign/organization/checkout/comment endpoints.
  No new endpoint or database migration was needed for this phase. Cookie auth,
  guest one-time giving, supported frequencies, server limits, giving pause,
  configured fees, unrestricted valid custom tips and real saved cards remain.
- Recurring/card consent, total-change consent reset, fixed reminder parameters,
  duplicate-submit protection, saved-card retry IDs and pending/error callbacks
  are retained. Receipt totals/dates/schedule come from verification, not URL
  parameters, random receipts or prototype dates. Print/share perform real actions.
- Nonpublic records are owner previews, not donor destinations. Organization
  verification badges and donation widgets respect server public status. Documents
  remain private owner/admin material. Monthly tiers are absent on weekly-only causes.
- Owner editing/resubmission/update tools have no equivalent designer screen.
  Their existing forms/mutations are preserved inside the source app frame; those
  expanded forms are not claimed as an exact source-copy. Form restoration will
  be handled with the creation/profile phase rather than replacing working tools.
- Additional working functionality occupies source styles: comment composer and
  real likes, campaign-level personal giving, needs, relevant public links,
  photo lightboxes/avatar fallbacks, guest receipt email and explicit charge consent.
  Mobile checkout retains the source fixed total/button with an expandable real
  fee breakdown. Required extra fields increase the checkout's full-page height.
- Source preset hints and Friend/Partner/Sponsor descriptions are illustrative
  editorial suggestions, not measured impact or live cost quotes. The user asked
  to retain source content pending real data. Replace these with approved campaign
  impact/tier content when an editable backend model/content source is available.
  The unsupported source “Most givers” statistical claim is not published.
- Organizer Message is still the source's honest coming-soon notice. A secure
  messaging/contact workflow is a separate missing feature, not fake delivery.
- `tests/fixtures/detail-design.json`: source class-expression manifest, with
  explicit exceptions for avatar fallback/lightbox wrappers, real reaction state,
  consent/custom input state, receipt actions and long-value wrapping. Core style
  expressions were copied, not independently redesigned.
- `tests/browser/detail-parity.mjs`: 12 equivalent-content comparisons at
  390/820/1024/1440px. Checked heading/gallery/identity/About/first-step/amount/
  sidebar geometry and typography/colors/radii match within 1px with equal fonts.
  Checkout sidebar full height is intentionally excluded because required real
  email/custom-tip/consent fields extend the grid. This is not full-page pixel
  equality for every real record or expanded functional state. Paired images and
  numeric report: `/private/tmp/azarfaith-detail-parity`.
- Fixture QA covers 15 detail cases and 24 checkout cases. It does not certify
  provider delivery, change live data, send emails or make real payments.

## Creation And Profile Restoration

- /register-org: original focused four-step form, category cards, progress,
  sticky footer and desktop preview. Real drafts/save-and-return, submit for review,
  numeric founded year, Other ministry, 100–200-word bio, photo/document uploads,
  normalized multiple public links and pending/public boundaries are retained.
- /create: original one-page three-column builder, six templates, checklist,
  card/page preview and mobile bottom sheet. Existing drafts and review endpoints,
  100–200-word story, real uploads, actual frequencies/needs and saved payout reuse
  remain. Rejected organizations are excluded; template instructions cannot be
  submitted unchanged. Success reflects the real server review status.
- Saving is explicit via Save draft or Save and exit. The prototype's timed
  autosave indicator is not used: Saved appears only after a successful request.
  Failed requests preserve fields. Draft/publication limits are kept distinct.
- /profile: source identity header, settings sidebar and section/card/footer
  recipes. Existing profile/avatar, in-app preferences, preferred/removable cards,
  password/session revocation and verified sign-in-email workflows remain connected.
  Payout and owner-activity controls are additional real features in source styling.
- Unavailable source controls remain visibly disabled with honest explanations:
  standalone card setup, newsletter subscription and account closure. These need
  provider/payment or account-retention decisions and backend workflows. Mandatory
  receipt emails are not falsely represented as optional in-app preferences.
- Extra verification documents, public links, needs, payout and account-security
  fields extend full-page height. This is faithful source hierarchy/style restoration,
  not a claim of full-page pixel identity for those functional additions.
- Source manifest: tests/fixtures/creation-design.json, retaining 209 of 225
  original style expressions with listed exceptions. The comparison suite checks
  core geometry/styles within 1px at 390/820/1024/1440px, with equal fonts/data.
  Extended panel/page heights are explicitly excluded, not silently ignored.
  Paired images/report: /private/tmp/azarfaith-creation-parity.

## Remaining Reference Screens

The audit confirms these actual reference screens still need faithful restoration:

| Group             | Reference screens                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Admin             | Overview; org/campaign/user lists and record tabs; Activity; Settings; sidebar review/directory groups |
| Public experience | `/story`, `/jos`, standalone `/map`, original long-form content page layouts                           |

Preserve existing additional management, receipt, callback, admin-login/profile,
and payout routes without presenting them as designer-source screens.

The source's public content destinations are informational pages, not proof that
team-giving, matching gifts, events or organizer messaging workflows exist. Separate
backlog: Facebook login, newsletter subscription, standalone add-card, account
closure, organizer messaging, richer map data, and approved editorial/legal data.
Those are not silently replaced by fake successes.

## Verification

Creation/profile follow-up: all 99 frontend Node tests, 19 creation browser cases,
28 profile/notification browser cases and 12 enforced source/live core layout
comparisons passed. TypeScript, targeted ESLint, production client/SSR build and
whitespace checks passed. Chrome screenshot QA was rerun serially after a browser
crash during concurrent runs. The reference remains unchanged. No backend edits,
DB writes, provider uploads, real emails or payments were made in this phase.
Changes remain local and unpushed.

Details/checkout follow-up: all 95 frontend Node tests, 15 detail browser cases,
24 checkout browser cases and 12 source/live core layout comparisons passed.
TypeScript, targeted ESLint, production client/SSR build and whitespace checks
passed. The designer reference remains unchanged. No backend edits, database
writes, real email or payment actions were performed in this phase. Temporary
QA servers were stopped; the user's development server was not changed.
Changes remain local and unpushed.

Actual Manage parity follow-up: all 89 frontend Node tests, 21 app functional
browser checks and 12 source/live dashboard geometry/style comparisons passed.
Frontend TypeScript, targeted dashboard/payout ESLint, production client/SSR build
and whitespace checks passed. The reference remains unchanged. No backend edits,
database writes or real payment/email actions were performed in this follow-up.

Manage follow-up: 87 frontend Node tests and all 14 isolated Manage browser checks
passed at 320/390/820/1440px, including organization navigation, publication-gated
sharing, error recovery and manual organization payout saving. TypeScript,
targeted ESLint, production client/SSR build and whitespace checks passed.

My Giving follow-up: all 84 frontend Node tests and 19 isolated My Giving browser
checks passed, including the actual navbar transition and 320/390/820/1440px
layouts. Frontend TypeScript, targeted giving ESLint, production client/SSR build
and whitespace checks passed. No new backend endpoints or database changes were
needed. Live payment-provider certification is separate. Changes remain unpushed.

Final pass: 78 frontend Node tests, 12 backend dashboard service/HTTP tests,
19 app browser cases and 20 auth browser cases passed. Frontend/backend TypeScript,
targeted frontend ESLint, production frontend build and whitespace checks passed.
Changes are local and unpushed; no production/staging records were changed.

- `tests/fixtures/app-design.json`: pinned source class expressions; all AppShell,
  AppNav, skeleton and Discover style expressions retained. Documented exceptions
  remove prototype controls, use live completed-step conditions, turn gift titles
  into functional links, and provide avatar fallback.
- `tests/app-restoration.test.mjs`: source-fidelity, navigation and endpoint guards.
- Existing discovery/dashboard unit tests cover API mapping and real statuses.
- `tests/browser/app-restoration.mjs`: isolated fixture-only desktop/mobile actions,
  URL filters, carousel/clipboard, pagination, drafts/rejection, auth gates/logout,
  queued thank-yous, payout request payloads and API failure recovery. `QA_FILTER`
  runs a single case, avoiding repeated full-suite runs while debugging.
- Backend dashboard service/controller tests verify privacy and owner restrictions.
- Side-by-side screenshots and geometry: `/private/tmp/azarfaith-app-comparison`.
  At 390/820/1440px, original/restored heading, quick-start heading, search and nav
  geometry match for the captured quick-start/browse frames with original fonts.
  This is not pixel-perfect certification of all content, carousel frames or live data.
- Browser fixtures do not exercise live delivery, payments or a production database.
