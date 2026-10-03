# Sign-up Redesign — Design Spec

**Date:** 2026-10-03
**Status:** Approved
**Figma source:** https://www.figma.com/design/gDv4PrT0ffGmfQMAfFjdRp/Azarfaith?node-id=141-23&m=dev (node `141:23`)

## 1. Purpose

Redesign the AzarFaith sign-up page to match the new Figma design, and use it to
establish the first set of shared visual tokens (color, typography) for the
broader app redesign the user wants to do page by page. This spec covers
**sign-up only**. Login, the rest of the marketing site, and any backend/auth
work are explicitly out of scope and will get their own specs later.

## 2. Context

The current `src/routes/signup.tsx` is a single-step form (full name, email,
phone, password) followed by a mocked 4-digit OTP step, styled with
hardcoded `amber-500` Tailwind classes (not the shared design tokens in
`src/styles.css`). Auth state is entirely client-side (`useApp().setAuthed`
in `src/lib/store.ts`, a Zustand store) — there is no backend, no real
session, and no real OTP delivery.

The Figma file is a competitive-research/moodboard file containing full
clones of other crowdfunding sites (GoFundMe, GoGetFunding, Crowdr) alongside
AzarFaith-branded screens. Node `141:23` is the only AzarFaith sign-up frame
in the file, and it is visually based on the "Untitled UI" design kit
(confirmed by leftover placeholder content: `olivia@untitledui.com`). It
shows the **account-method chooser** step (Google / Facebook / "Continue
with Email") — it does not show what happens after "Continue with Email" is
clicked, since Untitled UI's kit handles that as a separate screen not
included in this file.

## 3. Decisions made during brainstorming

| Question | Decision |
|---|---|
| Scope of "fresh project" | Rebuild in place, in this repo, on the existing stack (TanStack Start, React 19, Tailwind v4, Radix/shadcn, Zustand). No new repo. |
| Auth behavior | Visual/flow redesign only. Keep auth fully mocked via `useApp().setAuthed` — no real backend, no real OTP, no real OAuth. |
| Email step (not in Figma) | Design a new second step (email + password) in the same visual language as the Figma chooser screen. Drop the OTP step entirely. |
| Design tokens | Update global tokens in `src/styles.css` now (colors, fonts) rather than scoping overrides to this page only. This intentionally cascades to every other page immediately, since it's the start of the new design system — other unredesigned pages may look visually inconsistent until they get their own redesign pass later. That's accepted. |
| Body font | Figma uses "Google Sans Flex" (not publicly available). Use **Plus Jakarta Sans**, which the project already loads, as the stand-in — no new font dependency. |
| Display font | Figma uses "Coustard" (serif display), which **is** on Google Fonts. Replace `--font-display` (currently Fraunces) with Coustard. |
| Testimonial panel copy | Figma's right-panel quote/attribution ("Olivia Rhye", `olivia@untitledui.com`) is Untitled UI placeholder content. Replace with real AzarFaith mission copy. Do not invent a fake donor name, photo, or email. |
| Logo mark | Figma shows a sun/flower icon + lowercase "azarfaith" wordmark, different from the current `Flame`-icon lockup used in `Navbar.tsx`. Extract the real icon asset from Figma and use it on this page only. Swapping the shared `Navbar`/`Footer` logo is out of scope for this spec. |

## 4. Visual design

Two-column layout, full-bleed decorative background:

- **Background:** a soft blush/pink abstract illustration (Figma asset,
  downloaded locally) fills the page behind everything.
- **Top bar:** AzarFaith logo mark (new icon + wordmark) top-left;
  "Already have an account? Sign in" top-right, linking to `/login`.
- **Left: white bordered card** (~503px wide, padding 32px, border
  `#ebebeb`):
  - Eyebrow label: "More than $54M 💰 Raised" (small, medium weight)
  - Heading: "Create an account" — Coustard, large (~58px desktop)
  - Supporting copy: "Create your free account and support churches,
    missionaries, and faith-based organizations across Nigeria."
  - Two bordered white social buttons, each with icon + label:
    "Continue with Google", "Continue with Facebook"
  - One solid black button: "Continue with Email"
  - "Forgot your email or password?" line, both terms as orange
    (`#fe5102`) underlined links
  - Legal text: "By continuing, I agree to Azarfaith's terms, privacy
    policy, and cookie policy." — each term an orange underlined link
- **Right: floating quote panel** (~591px wide, no card background, sits
  directly over the illustration):
  - Large pull-quote in Coustard: *"Create your free account and support
    churches, missionaries, and faith-based organizations across Nigeria."*
    (reuses the existing AzarFaith sign-up tagline already written for the
    current page, so copy stays consistent with the rest of the site)
  - Attribution row: AzarFaith logo mark (small) in place of a personal
    avatar, with two-line text: **"AzarFaith"** / *"Give to those doing
    God's work."* (the site's existing tagline, from the PRD) — this
    replaces "Olivia Rhye" / `olivia@untitledui.com` without inventing a
    fake donor

**Step 2 (new, not in Figma): email + password.**
Same card shell and chrome (eyebrow/heading area replaced with a simpler
"Create your account" + back affordance to return to the chooser), fields:
Email, Password (react-hook-form + zod, already project dependencies),
single black "Create account" submit button. On submit: `setAuthed(true)`
and navigate to `/`. Right-side quote panel stays visible/unchanged for
continuity between steps.

**Google / Facebook buttons:** clicking either immediately calls
`setAuthed(true)` and navigates to `/` (same mocked behavior as today's
"Continue with Google", just visually restyled) — no real OAuth.

## 5. Responsive behavior

- **`lg` and up:** two columns side by side, matching Figma proportions.
- **Below `lg`:** single column. Right-side quote panel is hidden. Card
  becomes full-width with standard page padding. Background illustration
  still renders behind the card (simplified/cropped as needed so it doesn't
  visually compete with the card on narrow viewports).

## 6. Component structure

New folder `src/components/auth/`, since these are auth-screen-specific and
will be reused when the login page gets its own redesign pass later:

- `AuthCard` — the white bordered card shell (heading, body slot, footer
  slot) shared by both sign-up steps.
- `SocialButton` — bordered icon+label button (Google/Facebook variant).
- `TestimonialPanel` — the right-side floating quote + attribution block.

`src/routes/signup.tsx` becomes a small state machine:
`"choose" | "email"`, composing the above components. The existing
`Navbar`/`Footer` wrapper is dropped for this page, matching Figma: the
sign-up screen gets its own minimal top bar (logo + "Sign in" link) instead
of the site's full navigation, which is the standard pattern for focused
auth pages and matches the Figma source exactly.

## 7. Design tokens (`src/styles.css`)

- `--font-display`: `"Coustard", Georgia, serif` (replaces Fraunces). Add
  Coustard to the existing Google Fonts `@import`.
- Keep `--font-sans` as Plus Jakarta Sans (no change).
- Repoint `--primary` / `--primary-foreground` from the current teal to the
  new orange accent (`#fe5102`, expressed as `oklch()` to match the
  existing token format). `--primary` is currently only consumed by the
  shadcn/ui primitives (`button.tsx`, `badge.tsx`, `checkbox.tsx`,
  `progress.tsx`, `switch.tsx`, `tooltip.tsx`, `sonner.tsx`) — no hand-rolled
  page (including the admin dashboard) references it today, so this is a
  safe, contained repoint: new UI built with those primitives (including
  this page's "Create account" button) picks up the new accent
  automatically, nothing existing regresses.
- Add neutral text-gray tokens for `#232323` (body/heading text on this
  page) and `#344054` / `#475467` (secondary text in the testimonial
  attribution), as `oklch()` values alongside the existing `--foreground` /
  `--muted-foreground` tokens. Reuse `--foreground` / `--muted-foreground`
  directly if they're already close enough once converted; only add new
  tokens if they're visibly different.

## 8. Assets

Per the Figma MCP's design-to-code rules: download every static asset
referenced by the design (background illustration, Google/Facebook social
icons, logo icon+wordmark) via the Figma asset-download tool into the repo
(e.g. `src/assets/signup/` or `public/`), and reference them locally. No
temporary `figma.com/api/mcp/asset/...` URLs may remain in committed code.
The testimonial panel's avatar image is dropped (replaced by the logo mark,
per §4), so it does not need to be downloaded.

## 9. Out of scope

- Real backend auth, real OAuth, real OTP/email delivery
- Login page redesign (follow-up spec)
- Navbar/Footer-wide logo swap
- Any other page's redesign
