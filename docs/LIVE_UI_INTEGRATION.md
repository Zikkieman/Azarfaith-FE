# Refreshed UI: Live Integration

Design source: `https://github.com/mos-ski/azarfaith.git`, main commit
`6c27cda68d4c738b62e9867d7ca7b196ec828d7d`.

The design source uses local Zustand records and simulated mutations. Do not
merge its mock stores, session flag, payment success simulation, fixed user IDs,
hard-coded statistics, or local-only verification states into the live app.

## Completed: Authentication

- Refreshed sign-in, sign-up, OTP, password-reset and admin sign-in layout.
- Real `/auth/login`, `/auth/signup`, `/auth/verify-otp`, `/auth/resend-otp`,
  `/auth/google`, `/auth/forgot-password`, `/auth/reset-password`,
  `/auth/admin/login`, `/auth/session` and `/auth/logout` retained.
- HTTP-only cookie authentication retained. No browser access-token storage.
- Admin role guard retained. No self-registration as an administrator.
- Signup retains the phone field and consent checkbox required by the live flow.
- Removed unused `admin-mock.ts` and `admin-store.ts` from the live frontend.
- Improved API validation messages, expired-session handling and Google callback
  ownership when moving between sign-in and sign-up.
- Fixed admin avatar uploads to use the supported `user-avatar` folder.
- Restored landing-page logout and clear cached private data on account changes.
- Prevent auth-form interaction before hydration and the initial session check.
- Failed logout leaves the session visible and reports the failure instead of
  claiming the server cookie was cleared.

Other existing live screens are retained, including payouts, guest checkout,
organization documents, draft submission, recurring giving and notification
preferences. The dashboard and public catalog/detail screens below have been ported;
the remaining layouts are still listed for subsequent phases.
The side-panel photograph is decorative, not an invented verified organization
or claimed donation result. There is no unsupported Facebook sign-in button.

## Completed: Signed-In Dashboard

- `/dashboard` uses the refreshed dashboard layout and `GET /me/dashboard`.
- Login, Google sign-in and successful signup verification lead to `/dashboard`.
  Guests requesting it still return to the public landing page.
- Real donor lifetime/month totals, supported campaigns and active recurring gifts.
- Organization selector supports multiple owned organizations and personal campaigns.
- Successful-only received totals, distinct active recurring supporters, campaign
  review/draft states, recent gifts with anonymous names protected, and net payout
  balance from the existing payout accounting service.
- No simulated payouts, fictional bank numbers, fixed review checkpoints, thank-you
  confirmations or estimated financial figures. Links open the existing live flows.
- Monthly metrics use UTC calendar months, success `paidAt`, and `createdAt` only
  for legacy successful records without a payment timestamp. Gifts received is a
  transaction count, not an invented unique supporter count.
- API rejects non-owned organization IDs, never returns payment authorization or
  transfer-recipient secrets, and uses the existing cookie and suspension guard.
- This phase adds no database columns or migrations.

## Completed: Discover And Public Details

- Refreshed `/discover`, `/campaign/:id` and `/org/:id` with server-backed cards,
  featured collections, paginated filtering, search and sorting.
- New public `GET /campaigns/discover` and `GET /organizations/discover` return
  `{ items, total, page, pageSize, hasMore }`. Legacy collection APIs are unchanged.
- Public campaigns require both campaign approval and linked organization approval;
  direct checkout is blocked for unpublished records by the backend.
- Owners retain accessible draft/rejected previews, editing, upload, resubmission,
  campaign update and organization payout tools under Manage campaign/organization.
- Guest one-time checkout remains available with selected amount; recurring setup
  requires sign-in and offers only the campaign's configured frequencies.
- Recent giving stays in the desktop sidebar; comments remain below the story.
  Galleries have accessible lightboxes, public links remain real and shareable,
  and organization giving selects an actual approved campaign.
- Private registration documents and review notes are no longer exposed to public
  visitors or unrelated signed-in donors. Fabricated trust scores are removed.
- Real 404 responses show not-found; temporary API failures show retry, not mocks.
- Fixed account-cache reset ordering so session restoration cannot orphan newly
  started detail queries. Repeated owner reloads are part of browser regression QA.
- No database columns or migrations are added in this phase. Deploy backend first.

## Completed: Campaign Checkout

- Refreshed `/donate/:id` to the single-page numbered checkout, sticky desktop
  summary and mobile submit bar. The fee/tip breakdown remains visible on mobile.
- New guest-safe `GET /campaigns/:id/checkout` supplies actual fees, limits,
  supported frequencies and owned reminder-gift context. No admin settings API
  or hard-coded frontend fee fallback is used.
- Guest one-time gifts collect real receipt name/email; anonymity affects the
  public name only. Custom AzarFaith tips above 2500 remain supported.
- AUTO requires signed-in consent and a card; PLEDGE allows manual bank/card
  giving. Existing reminder links lock the recorded amount, mode and frequency.
- Real Paystack initialization and reference verification remain connected.
  Callback receipt fields and next scheduled date come only from the server.
- Pending callbacks show status recheck, not another payment form. Failures remain
  visible and retryable; no timers, fake card numbers or invented receipts.
- Server finalization is atomic against concurrent webhook/callback accounting;
  the worker reconciles stale references before deciding payment outcome.
- Browser-print receipt uses actual server fields. Email delivery is not claimed
  merely because a payment was confirmed. Guest donation history is not invented.
- No migration or new environment variable is needed. Deploy API/worker first.

## Completed: Profile And Notifications

- Refreshed `/profile` with a wide settings layout, real join date/name/email,
  avatar upload, profile save/discard, saved Paystack cards and creator links.
- Existing personal payout account/balances are retained. Stale account lookup
  responses cannot replace a newer bank selection or manually entered name.
  Provider failures never fabricate a verified account or zero balance.
- Persisted in-app preferences have Save/Discard and truthful error/retry states.
  They do not claim to opt out of receipts, security emails or SMS.
- Desktop and mobile bell open the same accessible, half-screen-height inbox,
  with server pagination, unread count, read/read-all and retry controls.
  Notification URLs are restricted to internal paths. Keyboard focus returns
  to the bell on close. No mock notification counts or cards are used.
- New authenticated `POST /auth/change-password` checks the current password,
  validates confirmation in the UI, hashes the replacement and revokes earlier
  sessions/reset links. Failed changes preserve login and display the API error.
- Deploy backend before frontend. No new migration/environment variable is needed.
  Existing cookies require a fresh sign-in once because of password-bound JWT
  session versions. See backend `docs/PROFILE_NOTIFICATIONS_API.md`.
- Unsupported email/city edits, account closure, default-card selection, fictional
  device counts and email/SMS opt-outs are not represented as functioning controls.

## Completed: Manage And Creation

- `/manage` uses the refreshed workspace shell, real owner lists and resumable
  organization/campaign drafts. Failures show retry, never fabricated empty lists.
- `/manage/org/:id` opens directly without waiting for unrelated workspace calls.
  Real 404s stay distinct from temporary dashboard failures.
- `/register-org` keeps the four-step flow with a live preview, 100-200-word bio,
  numeric founded year, Other ministry description, multiple validated public
  links, private verification documents and a first-photo cover.
- `/create` uses the refreshed section editor, actual readiness checklist,
  templates that preserve existing text, desktop preview and mobile preview dialog.
  One-time goals, ongoing frequencies, emergency urgency and needs/roles/skills
  all use real persistence. No sample photos or pretend autosave state.
- Save/save-and-exit persist drafts; submit saves first and then invokes moderation.
  Failed submission retains the form and draft ID. Background draft refreshes do
  not overwrite local edits. All private queries are scoped to the signed-in user.
- Uploads validate MIME, per-file 5 MB size and count limits before requests;
  partially successful batches retain their completed uploads.
- Campaign organization selection uses the owner's real organizations, not public
  discovery. Rejected organizations are unavailable. Payout eligibility remains
  authoritative on the backend, including inherited personal payout accounts.
- Draft API nullable fields allow clearing old organization/cover/goal/year values.
  Profile owner summaries now return review decisions and public-sharing eligibility,
  requiring approval of both the campaign and its linked organization.
- Submission validation now also blocks empty organization bios, short draft titles
  and empty item/volunteer/professional needs lists. Draft goals can remain partial.
- Deploy backend first. No database migration or new environment variable required.

## Remaining Screen Migration

My Giving is now refreshed with real payment history, summary cards, receipts,
saved-card controls and server-backed skip/edit dialogs. New authenticated
`PATCH /me/recurring-gifts/:id` and `/skip` use server-issued versions. Schedule
edits never modify an in-flight payment; AUTO changes require renewed consent.
History includes successful active recurring payments previously omitted from
the old completed-only list. CSV/HTML exports safely escape untrusted values.
Deploy the API and worker first. No migration or new environment variable is needed.

Port these next without introducing new data stores. Show actual empty/loading/
error states; never replace a failed request with sample records.

| Order | Screen                            | Available endpoints                                                                                                                                          | Integration notes                                                                                                                                              |
| ----- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Done  | Signed-in dashboard               | `GET /me/dashboard?organizationId=<owned-id-or-personal>`                                                                                                    | Refresh complete. All figures are server-backed; no invented impact counts.                                                                                    |
| Done  | Discover and public detail        | `GET /campaigns/discover`, `/campaigns/:id`, `/organizations/discover`, `/organizations/:id`                                                                 | Refresh complete with server pagination/filtering and guest access. Existing owner tools and `/org/:id` share URLs retained.                                   |
| Done  | Campaign checkout                 | `GET /campaigns/:id/checkout`; `POST /campaigns/:id/donations`, `/campaigns/:id/donations/verify`                                                            | Refresh complete with real configuration, guest giving, consent, pending/failure handling and server-confirmed receipts. No simulated saved-card payments.     |
| Done  | My Giving                         | `GET /me/donations`, `/me/donations/:id`, `/me/recurring-gifts`; `PATCH /me/recurring-gifts/:id`, `/skip`, `/pause`, `/resume`, `/cancel`, `/payment-method` | Refreshed with real history/receipts and schedule controls, explicit consent, pending-payment protection and truthful errors.                                  |
| Done  | Profile and notifications         | `GET/PATCH /me/profile`; `/me/payment-methods`; `/me/notifications`; `/me/notification-preferences`; `POST /auth/change-password`                            | Refreshed with real settings, cards, personal payout tools, mobile inbox and password revocation. No local-only mock controls.                                 |
| Done  | Manage, registration and creation | `/organizations/mine/drafts`, `/campaigns/mine/drafts`, draft/detail/create/edit/submit endpoints                                                            | Refreshed with server drafts, owner dashboard, validation, real media/documents, needs, frequencies and moderation. No mock autosave or instant-public claims. |
| 7     | User and admin payouts            | `/me/payout-*`, `/organizations/:id/payout-*`, `/admin/review/payouts`, `/payouts/release`, `/payouts/:id/finalize`                                          | The redesign omits existing payout screens. Retain/port them rather than deleting working functionality.                                                       |
| 8     | Admin review, users and settings  | `/admin/review/dashboard`, `/organizations`, `/campaigns`, `/users`, their detail/status routes; `/users/:id/role`; `GET/PATCH /settings`                    | Keep server authorization, audit logging, reasons and notifications. Existing list filters are limited to the controller contracts.                            |

## API Work Needed For New Design Features

These are proposed contracts, not existing routes. Build and test one module at a
time, then enable its frontend controls.

| Priority | Feature / screen                       | API or data work needed                                                                                                                                                                                          |
| -------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4        | Admin notification read state          | Existing `/admin/review/notifications` returns a generated feed. Add persisted per-admin read state, pagination, unread counts and read/read-all mutations. Do not claim notices are read just in local storage. |
| 5        | Admin activity screen                  | Add a paginated audit-log query with actor/target/date/action filters. Current dashboard activity is a limited subset, not a complete log endpoint.                                                              |
| 6        | Admin internal notes and review checks | Add notes/checklist models, admin-only read/write routes and audit entries. User and organization notes in the redesign are local-only.                                                                          |
| 7        | Admin emergency pause all giving       | Add a platform setting enforced by both donation initialization and recurring workers. A frontend toggle alone is unsafe. Define resume and overdue-charge policy.                                               |
| 8        | Admin detailed user verification       | Source email/phone/BVN verification independently. Do not infer them from a single `isVerified` flag or offer local-only BVN verification.                                                                       |
| 9        | Admin lists at scale                   | Public discovery pagination/filtering is implemented. Admin lists still need server pagination, sorting and additional filters.                                                                                  |
| 10       | Analytics / reporting                  | Add the aggregate metrics missing from current dashboard responses, with documented date ranges. CSV of already available records can be generated client-side; new metrics need backend queries.                |

Bulk review is not an existing backend endpoint. It can initially call the
existing single-record mutations with explicit partial-success handling; an
atomic bulk API is separate work. Persistent batch results must not be simulated.

Additional product gaps: comment author edit/delete and creator replies, update
editing with history, and a flagged-content moderation queue are not covered by
the current create-comment/create-update endpoints. Public FAQ/about content can
be static approved copy; it does not require a new API unless CMS editing is wanted.

Checkout-specific gap: using an existing saved card for a new one-time gift needs
an owned-authorization charge endpoint and consent/duplicate-attempt protection.
The payment-method list alone does not implement this; no fake saved card option
has been ported. A guest selecting recurring must sign in and reopen the donation
link; checkout return-after-login/signup is a separate navigation enhancement.

## Verification

Run `npm run test:auth`, `npx tsc --noEmit` and `npm run build` after integration.
Run `node --test tests/dashboard.test.mjs` for dashboard status and API contracts.
Run `node --test tests/discovery-integration.test.mjs` for public API contracts,
publication state, frequency handling, progress and activity timestamps.
Run `node --test tests/checkout.test.mjs` for configuration, custom tips, receipt
reference contracts, amount limits, recurring consent and safe provider redirects.
Run `node --test tests/giving.test.mjs` for real history totals, filters, safe
CSV/HTML exports and versioned schedule API contracts. Backend recurring suites
cover ownership, amount/frequency/consent validation, pause preservation, pending
claims, worker due-date checks, anonymity and transaction-reference correlation.
Future giving work: server-paginated reporting, dedicated recurring-action audit
history and durable confirmation delivery retries. Current confirmations are
best-effort, and live provider/database-lock testing is separate from fixture QA.
Backend dashboard tests cover ownership, successful-only accounting, anonymity,
UTC months, empty data, real JWT cookies, validation and suspended/expired sessions.
The unit tests execute production API/auth modules using isolated test transport
responses. They never create real accounts, send email, charge cards or modify a
database. Browser tests should additionally cover login errors, signup/OTP,
password-reset errors, admin denial and responsive layouts. Google and Paystack
provider end-to-end verification require their configured staging services.
