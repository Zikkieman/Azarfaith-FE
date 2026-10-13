# Browser Fixture Checks

These suites run against the real frontend with intercepted API/provider responses.
They do not send real email, charge cards or change staging/production records.

Use a local Playwright installation (`@playwright/test`) and an installed Chrome.
`PLAYWRIGHT_MODULE` can point to an external Playwright `index.mjs`; `CHROME_PATH`
can specify the browser executable. Public checks use Playwright's installed
Chromium when `CHROME_PATH` is not provided. Other suites default to macOS Chrome.

Start the frontend with `VITE_API_BASE_URL=http://127.0.0.1:19000` on port 18080.
The API port does not need a real server: test requests are intercepted.
Create `/private/tmp/azarfaith-qa` for screenshot output before running.

Run each file with Node:

- `tests/browser/creation-restoration.mjs`: source organization wizard/campaign
  builder at 320/390/820/1440px, draft save/resume/failure, template preservation,
  words/links/upload validation, documents, saved payout reuse, rejected-org guards,
  submission states and guest privacy. Defaults to FE 18221/API 19000.
- `tests/browser/creation-parity.mjs`: 12 source/restored organization/builder/profile
  core geometry/style comparisons at 390/820/1024/1440px, plus runtime/overflow checks.
  Reference 18220 and FE 18221/API 19000; required extra full-page/panel heights
  are excluded. Paired screenshots and measurements are saved under
  `/private/tmp/azarfaith-creation-parity`. Supports the same QA URL overrides.

- `tests/browser/detail-restoration.mjs`: campaign/organization layouts at four
  widths, gallery/lightbox navigation, guest giving, URL selections, real comment
  and like payloads, canonical clipboard/error handling, private documents,
  pending owner tools, weekly-only support, API recovery and image fallback.
  Defaults to port 18221 and intercepted API 19000; accepts `QA_FE_URL`,
  `QA_API_URL`, `QA_ARTIFACTS` and `QA_FILTER`.
- `tests/browser/detail-parity.mjs`: 12 source/restored campaign/org/checkout
  core geometry/style comparisons at 390/820/1024/1440px with equal fonts/data.
  Run the unchanged designer clone on 18220 and live FE on 18221 with API 19000.
  Required extra real checkout fields change full-page/sidebar height; that height
  is not asserted as pixel parity. Accepts `QA_REFERENCE_URL`, `QA_FE_URL`,
  `QA_API_URL`, `QA_ARTIFACTS`. Sample fixtures stay in tests, never the live UI.

- `tests/browser/dashboard-parity.mjs`: source/live `/dashboard` comparisons for
  onboarding, verified and pending states at 390/820/1024/1440px. Start the unchanged
  designer clone on port 18220 and the isolated frontend on 18221 with intercepted
  API port 19000. Checks main-section geometry (1px tolerance), typography/colors/
  radii, overflow and runtime errors; saves paired screenshots and `geometry.json`.
  Accepts `QA_REFERENCE_URL`, `QA_FE_URL`, `QA_API_URL`, `QA_ARTIFACTS`, `QA_FILTER`.
  Equalized sample images/counts exist only inside this comparison, not in live UI.

- `tests/browser/manage-restoration.mjs`: additional workspace and organization
  management screens at four widths, real navigation/draft links, approved-only
  sharing, clipboard errors, independent retries, guest/404 gates and organization
  payout saves. Defaults to frontend port 18221 and intercepted API port 19000;
  accepts `QA_FE_URL`, `QA_API_URL`, `QA_ARTIFACTS` and `QA_FILTER`.

- `tests/browser/giving-restoration.mjs`: restored My Giving at four widths,
  navbar navigation, paused gifts, amount/frequency/card consent, skip/cancel,
  history filters, CSV and real individual/combined receipt downloads.
  Defaults to frontend port 18221 and intercepted API port 19000; accepts
  `QA_FE_URL`, `QA_API_URL`, `QA_ARTIFACTS` and `QA_FILTER`.

- `tests/browser/app-restoration.mjs`: restored source dashboard and discovery at
  six widths, onboarding, org/personal/draft selection, actual review flags,
  thank-you/payout requests, URL filters, pagination, carousel/share and auth gates.
  Defaults to port 18221; accepts `QA_FE_URL`, `QA_API_URL`, `QA_ARTIFACTS`.
  `QA_FILTER` selects a case by name for focused debugging. Use intercepted API
  port 19000; no live database or API service is required.

- `tests/browser/auth-restoration.mjs`: designer auth screens at four widths,
  signup choice/form/OTP, Google callback/SDK failure, cookie-session routing,
  failed credentials, resend, reset, admin sign-in and safe checkout return.
  Defaults to port 18221; accepts `QA_FE_URL`, `QA_API_URL` and `QA_ARTIFACTS`.
  For the GIS fixture, start the frontend with
  `VITE_GOOGLE_CLIENT_ID=qa-client.apps.googleusercontent.com`; never use that
  dummy value in a real deployment. Actual provider/API requests are intercepted.

- `tests/browser/admin-features.mjs`: directories, review retries, analytics,
  search, giving pause, payout decisions and mobile overflow.
- `tests/browser/checkout-features.mjs`: source checkout controls, guest/recurring
  consent, callbacks, provider errors, saved-card retry identity, unsupported URL
  frequency, mobile fee breakdown, custom tips and paused checkout. Defaults to
  port 18221/API 19000; accepts `QA_FE_URL`, `QA_API_URL` and `QA_FILTER`.
- `tests/browser/profile-features.mjs`: settings, notifications, bank resolution,
  preferred cards, session revocation and verified email change.
- `tests/browser/public-features.mjs`: map, guides, real aggregates
  and error/retry layouts. Supports `QA_FE_URL` and `QA_API_URL` overrides.
- `tests/browser/landing-restoration.mjs`: restored designer landing at four
  widths, original section presence, live/sample campaign boundaries, FAQ/mobile
  navigation, session-aware dashboard/logout, newsletter/social notices and
  reduced/normal-motion rendering. Defaults to port 18221; accepts `QA_FE_URL`
  and `QA_API_URL` overrides. Use the same intercepted API port 19000.

These checks complement backend HTTP tests and disposable PostgreSQL migration
tests. Live Paystack, Google and Resend staging certification is separate.
