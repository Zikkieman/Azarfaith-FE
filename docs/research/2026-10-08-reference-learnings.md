# What AzarFaith can learn from the reference sites

8 Oct 2026. Sources: the Figma moodboard (frames 1-2, 1-3, 1-600, 1-1543, 1-3981, 106-7, 110-2, 110-24,
which capture GoFundMe, GoGetFunding, Crowdr and an early AzarFaith draft), the live sites
gofundme.com, gogetfunding.com and oncrowdr.com (Crowdr has moved off crowdr.ng), plus modash.io,
panxo.com and a shortlist from saaslandingpage.com (Maple, Buffer, Wispr Flow, Beehiiv, Lassie).

## Market facts worth knowing

- GoGetFunding no longer accepts Nigerian fundraisers and drops Nigeria from its create flow. That
  leaves a real gap for a Nigeria-first platform.
- Crowdr (now oncrowdr.com), the closest local peer: ₦ preset chips from ₦1k to ₦500k, a currency
  selector for diaspora givers, and a recurring toggle. Donors pay 1.5% + ₦100 for processing and
  organisers pay a 5% platform fee. The landing page leads with "fear of fraud" as the problem it
  solves.
- GoFundMe defaults its tip slider to 17.5%. That has drawn complaints, and AzarFaith should not copy it.

## Done in this pass

| Learning                                                                                   | Source                   | Where                                         |
| ------------------------------------------------------------------------------------------ | ------------------------ | --------------------------------------------- |
| Separate marketing nav from the product nav                                                | GoFundMe, Panxo          | `SiteNav` vs `AppNav`                         |
| "How it works" in 3 steps that include verification                                        | GoFundMe, Crowdr, Lassie | `HowItWorks` after the stats                  |
| Pinned feature scroller: dimmed titles, active one opens, media crossfades                 | Modash                   | `FeaturePanel` (desktop); accordion on phones |
| Statement headline that inks in word by word on scroll                                     | Modash, Panxo            | stats headline                                |
| Count-up stats rendered with real numbers in the HTML (Panxo ships "0" to non-JS visitors) | Panxo (avoid its flaw)   | `CountUp`                                     |
| Headings and card rows rise in, staggered                                                  | Modash                   | `Reveal`                                      |
| Auto-scrolling photo strip                                                                 | Modash, Panxo tickers    | yellow panel marquee                          |
| FAQ that actually opens, with an animated expand                                           | Modash                   | `Faq`                                         |
| Hide-on-scroll sticky nav, sticky donate card                                              | GoFundMe                 | both navs, campaign page                      |
| Skeletons for every app route and photo                                                    | general practice         | `Skeletons.tsx`, `Photo.tsx`                  |

## Recommended next: app flows (need a product decision)

1. **Checkout on one page, guest by default.** Put the Give once / Monthly / Quarterly toggle at the
   top, then ₦ preset chips and an anonymous toggle, and pay without an account. Today the donate
   flow is 3–4 steps. (GoFundMe, Crowdr)
2. **"Cover the fees" opt-in instead of a tip,** with the ₦ fee shown before payment. Avoid
   GoFundMe's preset 17.5% tip. _Decision: keep or drop the current optional tip?_
3. **Thank-you screen:** receipt, WhatsApp-first share, and an optional prayer or encouragement note to
   the organisation. (GoFundMe, Crowdr)
4. **Create flow order:** ask organisation type and state first, account sign-up later, then suggested
   goal and title, then preview. The wizard already has preview; move the account step later.
5. **Campaign page:** add the last 5 donors with time ago, a "Report this campaign" link, and a
   named giving guarantee badge that links to `/refunds`. Show offline (cash) giving recorded by the
   organisation. (GoFundMe, GoGetFunding)
6. **Diaspora:** a "Give from abroad" bar plus a currency selector with conversion to ₦. (Crowdr)
7. **Discover by Nigerian state** ("near you"), next to category. (GoFundMe's location selector)

## Recommended next: website

1. **Hero tiles by organisation type** (Church, Mission, Orphanage, School) under the CTAs, so givers
   land straight in a filtered Discover.
2. **Trust block that names the fear of fraud,** then answers it: verification steps, guarantee,
   payout rules. (Crowdr)
3. **Testimonial snap slider** in the orange band, with alternating quote and portrait cards
   (Modash). _Needs real testimonials. Today there is one placeholder quote._
4. **"Open giving" section:** a dot-grid map of Nigeria showing states with verified organisations,
   live totals and a feed of recent anonymous gifts. (Buffer, Lassie) _Needs real data._
5. **Button label roll on hover** and an arrow that slides on links. (Modash) Small polish.

## Recommended next: footer

- Cut about 35 links to 3–4 columns (about 20 links) and put the rest behind a "More" expander.
- Add a "Nigeria · English · ₦ NGN" selector, the CAC RC number and registered address, Refund policy
  and Accessibility links, and Instagram / X / TikTok / WhatsApp. Add app badges only once the apps
  exist.
- Back up "4.7/5 from givers" with a reviews source, or remove it. Keep only seals that link to
  something verifiable.
