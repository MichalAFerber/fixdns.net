# FixDNS.net

The marketing landing page for **FixDNS.net** — Michal Ferber's freelance DNS troubleshooting service. One-on-one Zoom sessions for DMARC / SPF / DKIM, the new Google + Microsoft email rules, and newsletter platform setup (MailerLite, Mailchimp, and the rest).

- **Live site:** https://fixdns.net
- **Booking:** https://cal.com/techguywithabeard/
- **Owner:** Michal Ferber (TechGuyWithABeard) · michal@techguywithabeard.com

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

Custom domain: `fixdns.net` (added via Cloudflare Pages → Custom domains). Secondary domain `brokedns.com` 301-redirects to the primary via a Cloudflare Bulk Redirect.

## Repository layout

```
astro.config.mjs        Astro + sitemap integration
public/
  _headers              Security headers (HSTS, X-Frame-Options, etc.)
  robots.txt            Points to sitemap-index.xml
  favicon.svg           Primary favicon
  apple-touch-icon.png  iOS home-screen icon (180x180)
  icon-192.png          PWA icon
  icon-512.png          PWA icon
src/
  layouts/Layout.astro  HTML shell, meta, Schema.org JSON-LD
  pages/index.astro     The landing page
  styles/global.css     All styles
```

## SEO notes

- Schema.org JSON-LD covers `Person`, `ProfessionalService` (with three `Offer` tiers), and `FAQPage`.
- Pricing tiers: $85 standard, $95 with recording, $145 after-hours.
- Long-tail keyword targets: DMARC/SPF/DKIM, Google + Microsoft sender requirements, MailerLite / Mailchimp / ConvertKit / Beehiiv DNS verification, plus a brand grid covering Cloudflare, GoDaddy, SiteGround, Hostinger, Namecheap, Bluehost, and 18+ other registrars and DNS hosts.

## License

All content © Michal Ferber. The source is published for transparency, not as a template — please don't copy the brand or copy.
