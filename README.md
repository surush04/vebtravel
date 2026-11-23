# M-SAYYOD — Website

Premium website for **M-SAYYOD** — wildlife conservation, Markhor protection, regulated hunting tourism and mountain tourism in Darvoz, Tajikistan (est. 2005).

Angular 22 · standalone components · signals · zoneless · SCSS · Reactive Forms · TJ / RU / EN.

```bash
npm install
npm run dev        # API server (3000) + site with live reload → http://localhost:4300
npm run build      # production build → dist/m-sayyod/browser
npm run server     # production: serves the built site + API + admin → http://localhost:3000
npm run admin:password -- "new-password"   # reset the admin password
```

## Admin panel — `/admin`

All site content is managed from the admin panel (Tajik interface):

| Section | What can be managed |
| --- | --- |
| Texts | Every text on the site in TJ / RU / EN: hero, about, timeline, conservation, why, contact form, footer, page heroes, SEO. List entries can be added, deleted and reordered. |
| Activities / Destinations | Add, edit, delete and reorder entries, with a photo and all texts in 3 languages |
| Gallery | Upload, replace and delete photos; caption, category and shape; add and remove categories |
| Page photos | Hero and section photos, plus their alt texts |
| Messages | Contact-form enquiries: read, mark as read or unread, reply, delete |
| Settings | Email, phone, WhatsApp, social links, maps, domain, founding year, hero video, admin password |

- **Saving:** text edits are saved with **Save** (or Ctrl + S). Photos are saved as soon as they are uploaded, converted automatically to AVIF/WebP/JPEG in 5 sizes.
- **Where data lives:** `server/data/`, which holds the texts, `site.json`, the photos in `uploads/`, the messages, and automatic backups of the last 30 versions in `backups/`. Back this folder up.
- **First start:** the content is imported from the current site, and a random admin password is printed in the server console. It can be changed in Settings, or set up front with the `ADMIN_PASSWORD` environment variable.
- **Hosting:** run `npm run build`, then `npm run server` on a Node.js host (VPS) behind HTTPS. If the site is hosted as static files only, it still works with the built-in content, but without the admin.

---

## Before going live — checklist

All unconfirmed information is deliberately left empty. Nothing was invented.

| What | Where |
| --- | --- |
| Production domain | `src/app/core/config/site.config.ts` → `siteUrl`, plus `public/sitemap.xml` and `public/robots.txt` |
| Email, phone, WhatsApp number | `site.config.ts` → `contact` (shown as "To be announced" until set; the WhatsApp button appears automatically) |
| Contact-form delivery | `site.config.ts` → `formEndpoint` (any endpoint accepting JSON POST, e.g. Formspree or your own API). Without it the form falls back to WhatsApp, or tells the visitor that online enquiries are not yet connected. |
| Office / meeting-point map | `site.config.ts` → `location.mapEmbedUrl` (hidden until set) |
| Social media | `site.config.ts` → `social[].url` (only configured links are shown) |
| Official logo | `src/app/shared/components/logo/logo.ts` and `public/favicon.svg` (current mark is an interim design) |
| Photographs | see **Photography** below |
| Hero video (optional) | `site.config.ts` → `heroVideo` (files in `public/video/`) |
| Translations review | `public/i18n/tg.json`, `ru.json` — have a native speaker proofread before launch |

## Photography

Each image on the site is a named **photo slot** (`hero-markhor`, `about-main`, `gallery-01` …; full list in `src/app/data/site.data.ts → MEDIA`). Until a real photo exists, the slot shows generated mountain artwork (in dev mode it also shows the slot name in the corner).

1. Save the original photo as `images-src/<slot>.jpg` (e.g. `images-src/hero-markhor.jpg`). Use at least 2400 px width for full-screen images.
2. Run `npm run images`.

The script creates AVIF + WebP + JPEG at 480–2400 px, updates `public/images/manifest.json`, and the site switches to the real photo automatically, with `srcset`/`sizes`, lazy loading and width/height set. `hero-markhor` also produces the Open Graph image `og-cover.jpg`.

Alt text for each slot is in the i18n files under `media.<slot>`. **Update it to describe the actual photo.**

## Architecture

```
src/app
├── core/config/        site.config.ts: all editable company settings
├── models/             TypeScript interfaces
├── data/               navigation, activities, destinations, gallery, photo slots
├── services/           translation (signals), media manifest, SEO, contact, scroll
├── layout/             header (transparent → solid, full-screen mobile menu), footer
├── shared/
│   ├── components/     button, icon, logo, media, section-heading, language switcher,
│   │                   activity card, gallery grid, lightbox, contact form, map, page hero,
│   │                   timeline, WhatsApp button
│   ├── sections/       hero, about, activities, destinations, conservation, gallery, why, contact
│   ├── directives/     scroll reveal
│   └── pipes/          `t` translation pipe
└── pages/              home, about, activities, destinations, gallery, conservation, contact, 404
src/styles/             design tokens, typography, layout, motion, mixins
public/i18n/            en.json, ru.json, tg.json: all site text
```

### Design system (`src/styles/_tokens.scss`)
- **Colours:** Forest `#142B22`, Charcoal `#151A17`, Gold `#C5A46D` (`#7A5C2E` for text on beige, for AA contrast), Beige `#E9E3D7`, White.
- **Type:** Cormorant Garamond (display, uppercase) + Manrope (text). Both include the Cyrillic and Tajik characters.
- **Section themes:** `.theme-dark`, `.theme-forest`, `.theme-light` set colour roles (`--fg`, `--fg-muted`, `--line`, `--accent-text`), and components read those roles.
- **Breakpoints (mobile-first):** 600 / 768 / 1024 / 1200 (desktop nav) / 1440 / 1920.

### Languages
- All text lives in `public/i18n/*.json`, and components contain no hard-coded copy.
- The language is detected from the saved choice, then the browser language, falling back to English. It is stored in `localStorage` and updates `<html lang>`, the title, meta and `og:locale`.
- To add text: add the key to all three files, then use `{{ 'section.key' | t }}`.

### Motion and accessibility
- Scroll reveals, a hero line animation, Ken Burns zoom, View-Transitions page changes, a scroll-driven parallax, hover zoom and the menu and lightbox animations are all switched off under `prefers-reduced-motion`.
- The site also has a skip link, visible focus styles, a focus trap and focus restore in the lightbox and menu, ARIA on the accordion, menu, filters and form, `inert` on the closed menu, and touch targets of at least 44 px.

### SEO
- Each page gets its own translated title and description, plus canonical, Open Graph, Twitter and JSON-LD (`TravelAgency`) tags.
- `sitemap.xml`, `robots.txt` and the web manifest are included.
- Interior pages are lazy-loaded, and the initial bundle is about 115 kB over the wire.
- For full crawler indexing of every language, consider adding Angular SSR/prerendering and language-prefixed URLs later.
