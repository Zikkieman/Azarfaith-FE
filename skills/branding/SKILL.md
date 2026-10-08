---
name: azarfaith-branding
description: AzarFaith brand and design system for every page, screen and asset — fonts (Coustard + Google Sans Flex), color tokens, type scale, layout rhythm, component recipes, copy voice, and the QA checklist. Use whenever creating or restyling any AzarFaith surface (landing, footer/content/legal pages, dashboard, auth, admin, email, social) or when asked "on brand?", "match the design", "which font/color/spacing should this use".
---

# AzarFaith Brand

Derived from the canonical landing page (`src/routes/index.tsx` + `src/components/landing/*`), which itself
matches Figma file `gDv4PrT0ffGmfQMAfFjdRp` node `338:2168` (1728px canvas). When in doubt, the landing page
is the source of truth: open it, screenshot it, match it.

## 1. Fonts — exactly two families

| Role                                        | Family               | CSS token        | Tailwind utility | Weights            |
| ------------------------------------------- | -------------------- | ---------------- | ---------------- | ------------------ |
| Display (headings, pull quotes, hero)       | **Coustard**         | `--font-display` | `font-display`   | 400, 900           |
| Everything else (UI, body, labels, numbers) | **Google Sans Flex** | `--font-gsf`     | `font-gsf`       | 400, 500, 600, 700 |

Imports live at the very top of `src/styles.css`:

```css
@import url("https://fonts.googleapis.com/css2?family=Coustard:wght@400;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&display=swap");
@import "tailwindcss" source(none);
```

Rules:

- **Never introduce a third family.** No Inter, Mona Sans, Hedvig Letters Serif, Google Sans Code,
  system UI stacks, or decorative serifs anywhere on a branded surface.
- `Plus Jakarta Sans` only exists as a fallback inside `--font-sans` for pre-existing app screens
  (dashboard/admin/auth). Branded surfaces set `font-gsf` explicitly on their root element.
- Headings default to Coustard through the base layer (`h1..h4 { font-family: var(--font-display) }`),
  but Tailwind utilities win — so always set `font-display` or `font-gsf` explicitly on headings rather
  than relying on the default.
- Never use weight 900 for running display text; Coustard 400 is the brand's display voice, 900 is
  reserved for numerals/stat moments only.

### Type scale (px / line-height / tracking)

| Token           | Size                      | LH          | Tracking                    | Family    | Used for                            |
| --------------- | ------------------------- | ----------- | --------------------------- | --------- | ----------------------------------- |
| Hero H1         | `clamp(44px,7.4vw,128px)` | `0.89`      | `-0.0096em`                 | display   | Landing hero                        |
| Page H1         | `clamp(32px,3.7vw,56px)`  | `1.08`      | `-0.01em`                   | display   | Content/legal page titles           |
| Section H2      | `clamp(30px,2.78vw,48px)` | `1.14`      | `-0.01em`                   | display   | In-page section headings            |
| Sub H2          | `clamp(30px,2.32vw,40px)` | `1.3`       | `-0.02em`                   | gsf / 500 | Panel headings (FeaturePanel style) |
| Sub H3          | `clamp(26px,2.08vw,36px)` | `1.1`       | `0`                         | gsf / 700 | Card/list headings                  |
| Lead            | `18px`                    | `27.9px`    | `-0.02em`                   | gsf       | Page intros, subcopy                |
| Body            | `16px`                    | `25.6px`    | `-0.02em`                   | gsf       | Paragraphs                          |
| Body small      | `15–16px`                 | `21–22.4px` | `-0.01em`                   | gsf       | FAQ rows, footer links              |
| Label / eyebrow | `13–14px`                 | `19.5–21px` | `0.1em`, `uppercase`, `600` | gsf       | Eyebrows, column heads              |
| Meta            | `13px`                    | `19.5px`    | `0`                         | gsf       | Copyright, timestamps               |
| Pull quote      | `clamp(24px,1.97vw,34px)` | `1.26`      | `-0.01em`                   | display   | Testimonials                        |

## 2. Color

| Token        | Hex                                         | Use                                                                      |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------------ |
| Brand orange | `#FE5102`                                   | Hero panel, testimonial band, progress fill, accents — large blocks only |
| Sun yellow   | `#FFE228`                                   | High-energy feature panel background                                     |
| Ink          | `#130E30`                                   | Primary dark (buttons, headings on light tints)                          |
| Ink soft     | `#4A4660`                                   | Secondary text on tints                                                  |
| Black        | `#000000` / `#232323` / `#141414`           | Nav bar, primary buttons, headings                                       |
| Paper        | `#FFFFFF`                                   | Page background                                                          |
| Panel        | `#F7F5F3`, `#F6F6F4`, `#F7F8F2`             | Neutral section/card backgrounds                                         |
| Line         | `#D9DDBC`, `rgba(19,14,48,0.14)`, `#EBECEC` | Dividers, borders, progress track                                        |
| Muted text   | `#667085`, `#8C8C8C`                        | Meta, placeholders                                                       |
| Peach        | `#FFEFE7`                                   | Newsletter pill                                                          |
| Olive dot    | `#B9BE9C`                                   | Trust-badge separators                                                   |
| Success star | `#00B67A`                                   | Rating stars                                                             |
| Card border  | `rgba(57,62,70,0.08)`                       | Content card edges                                                       |

Usage rules: one saturated brand block per viewport (`#FE5102` or `#FFE228`), never both side by side.
Text on saturated blocks is `#130E30` (yellow, orange light areas) or `#FFFFFF` (nav, orange with photo).
No gradients, no glass, no colored shadows.

## 3. Layout

- Design canvas **1728px**. Page content max-width `1280px` centered; full-bleed color bands span 100%.
- Gutters: `24px` mobile (`px-6`), `48px` tablet (`md:px-12`), `141–147px` at ≥1440 for landing bands
  (`md:px-[141px]` for content, `md:px-[147px]` for nav).
- Vertical rhythm: section padding `py-20 md:py-[120px]` for content pages, `py-24 md:py-[156px]` for
  landing sections. Gap between blocks inside a section: `24–28px`; between sections: `≥96px`.
- Split panels: left color column `868px`, right media column fills remainder, both `1059px` tall.
- Cards: radius `12–16px`, `24px` padding, `1px` border, no shadow. Media radius `20px`.
- Breakpoints: design desktop-first at 1728; every layout must collapse cleanly at `md (768)` and
  `sm (640)` — use `lg:` for fixed desktop heights/absolute positioning, stacked flow below.

## 4. Component recipes

- **Nav** (`landing/Nav.tsx`): black bar, `max-w-[1728px]`, logo `139.12×27.5`, links `16px/600`,
  inactive `text-white/70`, active `border-b-4 border-[#FE5102]`.
- **Primary button**: pill `rounded-full`, `border-2 border-black`, `bg-[#130E30]`, `text-[#EFF2E5]`,
  `px-[22px] py-3`, `16px/500`, tracking `-0.02em`, hover `opacity-90`.
- **Secondary button**: same geometry, transparent, `text-[#130E30]`, hover `bg-[#130E30]/5`.
- **Dark solid CTA** (hero): `rounded-[18px] bg-black px-8 py-[23px] text-[17px] font-semibold`, white text;
  outlined sibling uses `border-2 border-white`.
- **Eyebrow**: `14px/600 uppercase tracking-[0.1em]`, color `#130E30` or `#4A4660`.
- **Card (content)**: `rounded-xl border border-[rgba(57,62,70,0.08)] bg-white p-6`, hover lifts border.
- **FAQ row**: `border-t border-[#D9DDBC]`, `py-[17px]`, question `16px` `#130E30`, chevron `18px` right.
- **Seal / trust mark**: bordered box (`1px #D9DDBC`, bg `#F7F8F2`), icon + uppercase `11px` label +
  `12px` caption — use `landing/Seal.tsx`.
- **Newsletter pill**: `rounded-full bg-[#FFEFE7]`, input `h-14` with `border-b border-[#B6BA95]`, submit
  `h-full w-[116.24px] rounded-full border-2 border-black bg-[#130E30]`.
- **Footer**: white, 5 columns (`13px/600 uppercase tracking-[0.1em]` heads, `14px/21px` links),
  hairline dividers `#D9DDBC`, trust-badge row with `#B9BE9C` dots, socials in `42px` circles.
- Icons: **lucide-react** (`strokeWidth={1.5}`) or the SVGs in `src/assets/landing/`. Never emoji.

## 5. Imagery

- Photography: warm, human, documentary — people serving, churches, communities. Object-cover in
  `20px` radius frames; hero media fills its column edge-to-edge.
- Placement: two stacked `500×640` frames for the yellow panel (`-45.55px` / `482.45px` offsets),
  `20px` radius, no shadows.
- Source assets live in `src/assets/landing/`. Convert Figma PNG exports to JPEG (`sips -s format jpeg`)
  when >200KB; `sips` cannot write WebP. Keep the 12-file set lean — delete assets as soon as they are
  unreferenced.

## 6. Copy voice

- Name it **AzarFaith** (capital A, capital F), always. Never inherit copy from template/demo brands
  (GoFundMe, Ditto, Panxo, Modash, EcoVadis, CDP, Crowdr…).
- Currency is **₦**. Short, plain, confident sentences. Faith vocabulary: giver, church, ministry,
  missionary, orphanage, faith-based organization, stewardship, impact, verified.
- Buttons are verbs: `Start giving`, `Donate now`, `Register your org`, `Share campaign`.
- Never ship placeholder names in shipped copy (`Adedamolamoses` is a demo user for now; `name@church.org`
  is the newsletter placeholder).

## 7. Page templates (footer / content pages)

All non-app pages are built from one registry (`src/content/index.ts` → `pageMap`) rendered by the
single dynamic route `src/routes/$page.tsx` (one slug = one page; unknown slug renders the branded 404).
Content lives in `src/content/{legal,trust,giving,org,company}.ts` as `PageDoc[]`; never inline copy
into a route.

| Template    | Used for                                                                            |
| ----------- | ----------------------------------------------------------------------------------- |
| `legal`     | Terms, Privacy, Legal notices, Cookies — numbered sections, `Updated` date          |
| `guide`     | Trust & safety, Ways to give, For organizations — H2 sections, lists, callouts, FAQ |
| `cards`     | Blog, Guides, Events, Careers, Press, Campaign updates, Donor stories, Reports      |
| `directory` | Organizations                                                                       |
| `handbook`  | Manifesto, About, Help center, Support                                              |

Every page: `Nav` → eyebrow + `H1` (display) + lead → content blocks → closing CTA band → `Footer`.
Set `<title>` via the route `head`. Keep the exact tokens above; do not invent new colors or fonts.

### Sitemap (35 content slugs, all served by `/$page`)

- Legal: `terms` `privacy` `legal-notices` `cookies`
- Trust & safety: `verification` `community-reports` `refunds` `payment-security` `platform-fee`
  `data-protection` `moderation` `donor-stories`
- Ways to give: `give-once` `monthly-support` `emergency-appeals` `recurring` `team-giving`
  `sponsorship` `matching-gifts`
- For organizations: `payouts` `update-posts` `fees-pricing` `support` `guidelines` `reports`
- Company/resources: `about` `manifesto` `careers` `press` `blog` `guides` `help-center` `events`
  `organizations` `campaign-updates`
- App routes referenced by the footer stay as they are: `discover` `create` `dashboard` `my-giving`
  `register-org`

## 7b. App surfaces (signed-in product)

Every app route (`discover`, `dashboard`, `my-giving`, `profile`, `campaign/$id`, `org/$id`, `donate/$id`,
`register-org`) wraps in `AppShell` from `src/components/app/AppShell.tsx` — brand `Nav` (route-aware,
mobile menu, user dropdown) + `font-gsf` root. **No footer in the app**: the landing `Footer` belongs to the
website only (landing + `/$page` content pages). Primary mobile actions go in `AppShell`'s `bottomBar`
(fixed below `lg`) — see campaign detail and donate.
Build from its primitives instead of inline styles: `PageHeader`, `Container`, `SectionHeading`, `Pill`,
`ChoiceCard`, `Stepper`, `ProgressBar`, `StatTile`, `EmptyState`, `Notice`, and the class recipes
`btnPrimary`, `btnSecondary`, `inputClass`, `labelClass`, `eyebrowClass`, `cardClass`.
Campaign tiles always use `src/components/CampaignCard.tsx`. Auth screens (`signup`, `login`,
`forgot-password`) share `components/auth/AuthLayout.tsx`. Selection state is ink (`#130E30`), never
orange; category icons are lucide (from `categories` in `lib/mock.ts`), never emoji.

## 8. QA checklist (run before calling a page done)

**Headless Chrome gotchas (learned the hard way):**

- Screenshot one URL at a time with `pkill -f "Google Chrome.*headless"` **before each shot** —
  otherwise the new invocation is forwarded to the still-running instance and you capture the _previous_
  URL (looks fine, is the wrong page).
- `--window-size=430,...` lays out at **500px** (Chrome's minimum window width) while the PNG is 430px,
  so the right edge looks "cut off" — it is a capture artifact, not an overflow bug. Use
  `--window-size=500,...` for mobile checks, and confirm real overflow by injecting a temporary
  `useEffect` that writes `document.documentElement.clientWidth/scrollWidth` into `document.title`,
  then read it back with `--dump-dom`.
- The image reader may return a _different_ PNG than the one requested; verify by cropping a small
  region with PIL to a fresh filename (content-hash cache) before reading it.

```bash
npx tsc --noEmit            # must be clean
npm run lint                # 0 errors (4 pre-existing react-refresh warnings are OK)
npx prettier --write "src/**/*.{ts,tsx,css}" "skills/**/*.md"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/<route>   # 200
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1728,3000 --virtual-time-budget=12000 \
  --screenshot=/tmp/shots/<name>.png http://localhost:8080/<route>
```

Then eyeball the PNG: band colors, section order, no overflow, no third font, no leftover template
copy, footer renders, mobile stacks (re-shoot at `--window-size=430,3000`).
