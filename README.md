# FixDNS.net

The marketing landing page for **FixDNS.net** — Michal Ferber's freelance DNS troubleshooting service. One-on-one Zoom sessions for DMARC / SPF / DKIM, the new Google + Microsoft email rules, and newsletter platform setup (MailerLite, Mailchimp, and the rest).

- **Live site:** https://fixdns.net
- **Booking:** https://cal.com/techguywithabeard/
- **Owner:** Michal Ferber (TechGuyWithABeard) · michal@techguywithabeard.com
- **Repo class:** Class B — Monetized (TGWAB Dev Standards §10). Private repo, all rights reserved, no source/Octocat links on the site.

## Stack

- [Astro 5](https://astro.build) — static site generator
- [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — auto-generated sitemap
- Vanilla CSS in `src/styles/global.css`
- Zero JavaScript at runtime

## Local development

```sh
npm install
npm run dev      # http://localhost:4321
```

## Build

```sh
npm run build    # outputs static files to ./dist
npm run preview  # serve the built site locally
```

## Deployment

Hosted on **Cloudflare Pages**, auto-deployed from this repo's `main` branch.

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output | `dist` |
| Root directory | *(empty)* |
| Node version | 20 or 22 |

Custom domain: `fixdns.net` (added via Cloudflare Pages → Custom domains). The `www.fixdns.net`, `brokedns.com`, and `www.brokedns.com` aliases are also attached to the same Pages project; a Pages Functions middleware (`functions/_middleware.js`) 301-redirects every non-apex hostname to `https://fixdns.net/` so Search Console sees real redirects instead of duplicate "alternate page" entries.

## Repository layout

```
astro.config.mjs             Astro + sitemap integration
functions/
  _middleware.js             301-redirects non-apex hosts to https://fixdns.net/
scripts/
  og-card.svg                Source art for the Open Graph card
  gen-assets.mjs             Rasterizes og.png + favicon.ico (needs: npm i --no-save sharp)
public/
  _headers                   Security headers + strict CSP
  robots.txt                 Points to sitemap-index.xml
  site.webmanifest           PWA manifest
  ads.txt                    Declares no authorized ad sellers
  llms.txt                   Site summary for AI crawlers (llmstxt.org)
  .well-known/security.txt   RFC 9116 security contact
  og.png                     Open Graph / Twitter card (1200x630)
  favicon.svg                Primary favicon = brand icon
  favicon.ico                Legacy favicon fallback (16/32/48)
  apple-touch-icon.png       iOS home-screen icon (180x180)
  icon-192.png               PWA icon
  icon-512.png               PWA icon
src/
  layouts/Layout.astro       HTML shell, meta, Schema.org JSON-LD
  pages/index.astro          The landing page
  pages/404.astro            Branded not-found page
  styles/global.css          All styles
```

## Deviations from TGWAB Dev Standards

- **Vanilla CSS instead of Tailwind** — this is a single-page landing site with one
  ~390-line stylesheet (`src/styles/global.css`). A Tailwind toolchain would add build
  weight and churn without a maintenance win at this size, so styles stay vanilla.
- **`Permissions-Policy` omits `interest-cohort`** — the FLoC feature was withdrawn and
  Chrome now logs `Unrecognized feature: 'interest-cohort'`, so it is intentionally left
  out of the standards template's value.

## SEO notes

- Schema.org JSON-LD covers `WebSite`, `Person`, `ProfessionalService` (with three `Offer` tiers), and `FAQPage`.
- Open Graph / Twitter card served from `public/og.png` (1200×630), regenerated via `scripts/gen-assets.mjs`.
- Pricing tiers: $85 standard, $95 with recording, $145 after-hours.
- Long-tail keyword targets: DMARC/SPF/DKIM, Google + Microsoft sender requirements, MailerLite / Mailchimp / ConvertKit / Beehiiv DNS verification, plus a brand grid covering Cloudflare, GoDaddy, SiteGround, Hostinger, Namecheap, Bluehost, and 18+ other registrars and DNS hosts.

## License & rights

**All rights reserved.** © 2026 Michal Ferber. FixDNS.net is a paid service, so
under §10 of the TGWAB Dev Standards this is a **Class B — Monetized** project:
the repository is private and the code and content carry **no license grant**.
You may not copy, reuse, redistribute, or adapt the source, brand, or copy.
Bundled third-party dependencies remain under their own licenses (see their
respective packages).
