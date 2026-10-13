# Designer Auth Restoration

## Source And Scope

Source is the untouched sibling `../azarfaith-design-reference`, repository
`https://github.com/mos-ski/azarfaith.git`, commit
`6c27cda68d4c738b62e9867d7ca7b196ec828d7d`. All work stays in the existing
`../azarfaith` frontend. Backend, database, environment secrets, reference files
and unrelated user work remain unchanged. No commit, push or deployment is made
by this pass.

Original source screens restored:

- `/login`: original frame, copy, social stack, divider, field recipes and actions.
- `/signup`: provider/email choice, first/last-name form, terms links and four-box OTP.
- `/forgot-password`: original request form and generic check-your-inbox confirmation.

The reference has no standalone `/reset-password` or administrator login design.
Those existing functional screens now use the same original auth kit without
inventing a separate visual language. The shared logo, photo URL, desktop preview
card, 420px column, responsive spacing, field sizes and fully rounded buttons
are copied from the source. Fonts use the isolated original variable Google Sans
Flex face. The side-panel organization/update remains an explicitly labelled
illustrative example, not a live organization lookup or verified impact claim.

## Deliberate Integration Differences

- Email/phone login is retained because the backend supports both; the reference
  only labels this field Email. The original geometry is unchanged.
- First and last names map to the existing `fullName` payload; no new user schema.
- Email signup retains the real API's required phone field and existing explicit
  consent checkbox. The extra fields make that screen taller than the prototype.
  Password visibility and UTF-8/bcrypt-compatible length validation are retained.
- OTP now submits to `/auth/verify-otp` when four digits are completed. There is
  no prototype timer that grants authentication. A failed code is not retried in
  a loop. Explicit verification/retry, resend cooldown, paste, backspace and
  change-email actions supplement the original boxes. A refreshed OTP URL without
  a pending challenge shows an honest recovery state rather than pretending to
  remember a verification email.
- Google uses the real GIS-rendered control, not the source's simulated social
  click handler. It uses a pill shape and a proportional full-column fit without
  altering Google's logo, content or provider-controlled personalization. GIS
  rendering takes a width of at most 400px; proportional scaling retains the
  logo's aspect ratio. See [Google API reference](https://developers.google.com/identity/gsi/web/reference/js-reference)
  and [branding guidelines](https://developers.google.com/identity/branding-guidelines).
  A Google identity callback is sent to the existing `/auth/google` endpoint.
- The source Facebook control is present but disabled with an unavailable label
  and explanatory title. There is no Facebook endpoint/provider configuration in
  the live integration. Enabling it requires a registered Meta app, approved
  credentials/origins and server-side token verification; it must not share the
  prototype's fake Google/Facebook authentication handler.
- Confirmed Redux session state owns one guarded post-auth router transition.
  Donors go to `/dashboard`; administrators go to `/admin`. Checkout returns keep
  the existing allowlist and amount/frequency context. External redirects are
  discarded. No frontend access token or writable prototype session cookie is
  stored; the API still uses the existing HTTP-only cookie flow.
- Existing email reset request and reset-token APIs remain connected. The server's
  current 30-minute reset expiry is shown accurately, and failures do not display
  the successful inbox/password-changed states.

All supported flows use existing endpoints:
`/auth/session`, `/auth/login`, `/auth/signup`, `/auth/verify-otp`,
`/auth/resend-otp`, `/auth/google`, `/auth/forgot-password`,
`/auth/reset-password` and `/auth/admin/login`. No new endpoint, migration or
environment setting is required for the supported auth screens. Existing real
Google client IDs/origin configuration must remain correct in each environment.

Landing registration links now open the restored provider-choice screen.
Explicit `/signup?mode=form` remains supported for existing integrations. The
restored terms/privacy/cookie links resolve, but their approved legal content
still requires the separate resource-page pass documented in
[Landing Restoration](LANDING_RESTORATION.md); previews are not legal policies.

## Verification

Final results: 72 frontend tests, 20 auth browser checks and all 12 landing
regression checks passed. TypeScript, the production build, targeted auth ESLint
and `git diff --check` passed. All backend/reference source checks remain clean.

`tests/fixtures/auth-design.json` pins the source commit, original shared class
expressions, input/label/back/title recipes and all four signup SVG hashes.
`tests/auth-restoration.test.mjs` protects those styles/assets, real action
bindings, signup payload mapping, the OTP retry boundary and the Google lifecycle.

`tests/browser/auth-restoration.mjs` runs isolated API and GIS fixtures, not real
account creation or email delivery. It checks all auth screens at 320/390/820/1440px,
signup steps, no horizontal overflow, stable input identity while typing, delayed
hydration, password visibility, failed credentials, actual signup payload, valid
and invalid OTP, paste, resend cooldown, changed email and missing challenge,
duplicate signup, unverified login, Google rejection/success/current callback,
single initialization, full-width fit, failed SDK notices, disabled Facebook,
reset request/token failures and success, restricted admin sign-in, existing
session redirection, unsafe redirect rejection and exactly-once checkout return
with the selected amount/frequency retained. Twenty browser checks passed.

Thirty source-versus-restored screenshots were captured using original fonts and
imagery: login, signup choice, signup form, reset request and reset confirmation
at 390/820/1440px. Screenshots were inspected. Heading boxes, column geometry and
50px field heights match for login/choice/reset states. The email signup form is
128.5px taller and its centered heading is 64.25px higher because of the required
phone/consent additions; other geometry and the desktop aside are unchanged.
Google's native content and the disabled Facebook state are deliberate differences,
not pixel-identical replicas. OTP, standalone reset and admin functional variants
are covered by browser checks, not claimed as standalone original-source designs.

TypeScript, the production build, the full frontend regression suite and targeted
auth lint are checked before handing the phase back. Live Google consent/origin
and real email delivery certification remain separate from fixture QA.
