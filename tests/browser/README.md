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

- `tests/browser/admin-features.mjs`: directories, review retries, analytics,
  search, giving pause, payout decisions and mobile overflow.
- `tests/browser/checkout-features.mjs`: guest/recurring consent, callbacks,
  provider failures, saved-card retry identity and paused checkout.
- `tests/browser/profile-features.mjs`: settings, notifications, bank resolution,
  preferred cards, session revocation and verified email change.
- `tests/browser/public-features.mjs`: landing, map, FAQ, guides, real aggregates
  and error/retry layouts. Supports `QA_FE_URL` and `QA_API_URL` overrides.

These checks complement backend HTTP tests and disposable PostgreSQL migration
tests. Live Paystack, Google and Resend staging certification is separate.
