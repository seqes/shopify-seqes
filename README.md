# Seqes Shopify Theme

A production-hardened Shopify theme for Seqes, based on the Shrine theme and
optimized for Core Web Vitals, accessibility, and security. Ships with a
lazy-hydration runtime, deduplicated CSS, strict XSS-aware Liquid patterns,
and a full local + CI tooling setup (Theme Check, Prettier, Husky, GitHub
Actions).

---

## Table of contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Project layout](#project-layout)
- [Development workflow](#development-workflow)
- [Tooling](#tooling)
- [Performance architecture](#performance-architecture)
- [Accessibility](#accessibility)
- [Security](#security)
- [Releasing](#releasing)
- [Troubleshooting](#troubleshooting)

---

## Requirements

- **Node.js** >= 18.17
- **npm** >= 9 (Yarn or pnpm also fine; lockfile is not committed)
- **Shopify CLI** 3.x (installed via `npm install` as a devDependency, or globally)
- A Shopify store where you have `themes` access

## Getting started

```bash
# 1. Install tooling (Shopify CLI, Prettier, Husky, lint-staged, Theme Check)
npm install

# 2. Authenticate the CLI (one-time)
npx shopify auth login

# 3. Start a local dev server against the dev store defined in shopify.theme.toml
npm run theme:dev
```

You can switch stores/themes via `shopify.theme.toml` environments:

```bash
npx shopify theme dev     --environment=development
npx shopify theme push    --environment=staging
npx shopify theme push    --environment=production
```

## Project layout

```
assets/      - JS, CSS, images, and fonts served from the Shopify CDN
config/      - settings_schema.json and settings_data.json
layout/      - theme.liquid (and alternates)
locales/     - translation files (managed in Shopify admin)
sections/    - top-level page sections
snippets/    - reusable Liquid partials
templates/   - page / product / collection / etc. templates (JSON-based where possible)
context/     - internal-only notes, NOT uploaded to Shopify (see .shopifyignore)
```

Root config files of note:

| File | Purpose |
| ---- | ------- |
| `.theme-check.yml` | Shopify Theme Check rules (CI + local) |
| `.prettierrc` / `.prettierignore` | Formatting rules, Liquid plugin |
| `.editorconfig` | Editor-level whitespace / EOL rules |
| `.gitattributes` | LF normalization + binary declarations |
| `.shopifyignore` | Files that must NOT be pushed to the store |
| `shopify.theme.toml` | CLI environments (dev / staging / prod) |
| `package.json` | Dev tooling + npm scripts |

## Development workflow

```bash
# live preview
npm run theme:dev

# lint (theme-check + prettier --check)
npm run lint

# format everything
npm run format

# theme-check only
npm run theme:check
```

A Husky pre-commit hook runs `lint-staged`, which formats staged files with
Prettier. A GitHub Actions workflow runs `npm run lint` on every push / PR.

## Tooling

- **Theme Check** — validates Liquid, flags deprecated filters, parser-blocking
  scripts, missing `width/height` on images, oversized assets, etc.
- **Prettier** + `@shopify/prettier-plugin-liquid` — consistent formatting for
  Liquid, JS, CSS, JSON, and Markdown.
- **Husky + lint-staged** — runs Prettier on staged files pre-commit so bad
  formatting can't land.
- **GitHub Actions** — CI runs `theme-check` and `prettier --check` on every
  push / pull request (see `.github/workflows/theme-check.yml`).

## Performance architecture

The theme is built around **lazy hydration** to keep initial page weight low:

- `assets/lazy-hydrate.js` exposes `window.SeqesLazy.register({ id, selector,
  rootMargin, assets })`. Scripts registered through it are only fetched once a
  matching element approaches the viewport (via `IntersectionObserver`).
- Heavy components (Google Maps, `shrine-components.js`, `bundle-deals`,
  `promo-popup`, `comparison-slider`, `internal-video`, etc.) are lazy-hydrated.
- Shared banner / slideshow CSS lives in `assets/banner-shared.css` and is
  imported by multiple sections to maximize CDN caching.
- Images use explicit `width`, `height`, `srcset`, and `sizes` so the browser
  can reserve layout space and pick the right variant — critical for CLS and
  LCP.
- Critical CSS is kept small; non-critical CSS is loaded with
  `media="print" onload="this.media='all'"` where appropriate.

## Accessibility

- Modals (cart drawer, search drawer, product drawer, insta-stories viewer)
  use `role="dialog"`, `aria-modal="true"`, `aria-labelledby` / `aria-label`,
  and toggle `aria-hidden` automatically.
- `assets/focus-trap.js` auto-wires a focus trap + Escape-to-close onto any
  `.side-panel` or `.insta-stories__modal` by observing class / data-attribute
  changes.
- Icon-only buttons expose `aria-label`s.
- Inline `onclick` handlers have been replaced with `addEventListener` bindings
  so CSP-friendly builds remain possible.

## Security

Liquid-level hardening applied across the theme:

- All reflected user input (`search.terms`, `form.first_name`, `comment.*`,
  etc.) is escaped with `| escape`.
- URL metafields and comment author URLs are validated against `http:` /
  `https:` schemes before being rendered; external links get
  `rel="noopener noreferrer"` and `target="_blank"`.
- Color metafields are validated against a strict hex regex before being
  interpolated into `style="..."`.
- JS paths that previously used `innerHTML` / `insertAdjacentHTML` with
  user / API data (cart errors, variant labels, shipping estimator) were
  rewritten to use `textContent` + DOM APIs.
- Social share links upgraded from `http://` to `https://` to avoid mixed
  content.

## Releasing

1. Make sure you're on `main`, with a clean working tree.
2. Update `CHANGELOG.md`.
3. `npm run lint` must pass.
4. Push to staging first:
   ```bash
   npx shopify theme push --environment=staging
   ```
5. QA on the staging theme (Lighthouse + manual smoke test).
6. Tag the release and push to production:
   ```bash
   git tag v-post-hardening
   git push origin v-post-hardening
   npx shopify theme push --environment=production
   ```

## Troubleshooting

- **Theme Check reports `AssetSizeJavaScript` over threshold** — check for
  vendor bundles that could be lazy-hydrated or split.
- **Prettier/liquid plugin can't parse a file** — confirm it's not in
  `.prettierignore` (e.g. `locales/*`, minified assets) and that the Liquid
  syntax is valid.
- **Pre-commit hook not running** — run `npm install` again so `husky install`
  re-registers the hooks directory. On Windows, make sure the `.husky/` files
  have LF line endings (enforced via `.gitattributes`).
- **CLI won't push** — verify `shopify.theme.toml` environments and that
  `.shopifyignore` isn't excluding something you expect to upload.
