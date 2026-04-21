# Changelog

Theme: Reformation (SEQES customization)

All notable modifications made on top of the original Reformation theme are documented here, so that future Reformation updates can be merged manually with minimal conflict.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates in ISO 8601.

Git tags:

- `v-pre-optimization` - baseline snapshot before the deep performance refactor. Use `git reset --hard v-pre-optimization` to revert all optimization work.
- `v-pre-hardening` - snapshot before the production-hardening pass (security / a11y / tooling / CI).
- `v-post-hardening` - snapshot after the production-hardening pass completed.

---

## Unreleased - Production hardening pass

Security, dead-code cleanup, performance polish, accessibility, tooling, documentation, and CI on top of the deep performance optimization.

### Phase 9 - Security

- **`snippets/search-drawer.liquid`**: escape reflected `search.terms` in the search input `value` attribute.
- **`sections/main-register.liquid`**: escape `form.first_name` / `form.last_name` reflected in registration input values.
- **`sections/main-addresses.liquid`**: escape every reflected `form.*` address field (`first_name`, `last_name`, `company`, `address1`, `address2`, `city`, `zip`, `phone`).
- **`sections/main-article.liquid`**: validate `comment.url` against `http:`/`https:` schemes (otherwise render author as plain text), escape `comment.author`, escape `form.body` textarea contents, escape `form.author` and `form.email` values, and add `rel="nofollow ugc"` + `target="_blank" rel="noopener noreferrer"` on the author link.
- **`snippets/product-specification-metafield.liquid`**: URL scheme validation for `metafield_type == "url"` (http/https only, `rel="noopener noreferrer"` on external links), `| escape` on image `alt` attributes instead of `| json`, strict hex-only regex gate on `metafield_type == "color"` before interpolating into `style="background-color: ..."`, and `| escape` on reference titles.
- **`assets/cart.js`**: switched cart line error display from `innerHTML` to `textContent`.
- **`assets/product.js`**: switched variant option label updates from `innerHTML` to `textContent`.
- **`assets/shipping-estimator.js`**: rewrote `formatShippingRates` and `formatError` to use `textContent` + `createElement` / `appendChild` instead of `innerHTML` / `insertAdjacentHTML`, removing an XSS vector on shipping API responses.
- **`sections/main-account.liquid`**: fixed `address.default_address.province_code` bug; now correctly reads `customer.default_address.province_code`.
- **`sections/social-share.liquid`**: upgraded Facebook and Pinterest share URLs from `http://` to `https://` and added `target="_blank" rel="noopener noreferrer"` to all share links to prevent mixed content and tab-nabbing.

### Phase 10 - Dead code cleanup

- Deleted `snippets/newline_to_span.liquid` (no `render` / `include` references in the codebase).
- Deleted `sections/seqes-testimonials.liquid` (superseded by the canonical `sections/testimonials.liquid`).
- Deleted `sections/results.liquid` (not referenced from any `templates/*.json` or `config/settings_data.json`).
- **`layout/theme.liquid`**: replaced the hardcoded `collection.handle == 'some-handle'` price-hiding block with a metafield-first, tag-fallback check (`collection.metafields.custom.hide_price` or a `hide-price` tag), so merchandisers can flip it from admin without a code change.

### Phase 11 - Performance polish

- **`sections/map.liquid`**: Google Maps JS API is now registered with `SeqesLazy.register` (`rootMargin: 400px 0px`) instead of loaded eagerly, so pages with a map below the fold no longer pay for `maps.googleapis.com` on first paint.
- **`snippets/shrine-components-lazy.liquid`** (new): one centralized `SeqesLazy.register` entry for `assets/shrine-components.js` that triggers on a compound selector (`content-tabs, parallax-hero, hotspot-button, splide-component, slideshow-component, slider-component, copy-button, countdown-timer, deferred-media, details-disclosure`). Replaces multiple duplicate `<script src=...shrine-components.js>` tags in individual sections.
- **`sections/collage.liquid`**, **`sections/image-slider.liquid`**, **`sections/shoppable-image.liquid`**, **`sections/content-tabs.liquid`**, **`sections/section-group.liquid`**, **`sections/slideshow-hero.liquid`**, **`sections/parallax-hero.liquid`**, **`sections/product-features.liquid`**: replaced inline `<script src=".../shrine-components.js">` with `{% render 'shrine-components-lazy' %}`.
- **`assets/banner-shared.css`** (new): extracted duplicated `.banner*` and `.slideshow.banner*` base rules from `sections/image-banner.liquid`, `sections/email-signup-banner.liquid`, and `sections/slideshow-hero.liquid` into a shared, CDN-cacheable stylesheet. Those sections now `{{ 'banner-shared.css' | asset_url | stylesheet_tag }}` and only keep section-specific dynamic CSS (overlay opacity, color scheme) inline.
- Added explicit `width`, `height`, `srcset`, and `sizes` to images in: `sections/icon-bar.liquid`, `sections/vertical-ticker.liquid`, `sections/horizontal-ticker.liquid`, `sections/bundle-deals.liquid`, `sections/shoppable-image.liquid`, `sections/icons-with-content.liquid`, `sections/insta-stories.liquid`. This helps CLS (reserved layout space) and LCP (browser picks the right variant earlier).
- **`assets/bundle-deals.js`**, **`assets/promo-popup.js`**, **`assets/comparison-slider.js`**, **`assets/internal-video.js`** (all new): extracted inline custom-element bodies from the corresponding sections into dedicated cacheable assets.
- **`sections/bundle-deals.liquid`**, **`sections/promo-popup.liquid`**, **`sections/comparison-slider.liquid`**, **`sections/multirow.liquid`**: replaced the inline `<script>` blocks with `SeqesLazy.register` stubs pointing to the new assets, so the components only hydrate when their custom elements enter the viewport.

### Phase 12 - Accessibility

- **`snippets/cart-drawer.liquid`**: added `role="dialog"`, `aria-modal="true"`, `aria-labelledby="Cart-Drawer-Title"`, `aria-hidden`, and an `aria-label` + keyboard-actionable attributes on the close button.
- **`snippets/search-drawer.liquid`**: same treatment as the cart drawer (`role="dialog"`, `aria-modal`, `aria-label`, `aria-hidden`, accessible close).
- **`sections/insta-stories.liquid`**: modal container gets `role="dialog" aria-modal="true" aria-label aria-hidden`; pause/resume, volume, close, and prev/next chevron buttons gain `type="button"` + descriptive `aria-label`s.
- **`assets/focus-trap.js`** (new): `window.SeqesFocusTrap` helper providing `activate(container, options)` / `deactivate(container)` with Tab / Shift+Tab trapping, initial focus placement, Escape-to-close, and focus restoration. Auto-wires itself to `.side-panel` (via `.active` class observation) and `.insta-stories__modal` (via `data-open` attribute observation) using `MutationObserver`, and toggles `aria-hidden` accordingly. Dependency-free, no polyfills required.
- **`layout/theme.liquid`**: loads `focus-trap.js` with `defer`, immediately after `lazy-hydrate.js`.
- **`templates/gift_card.liquid`**: removed inline `onclick="window.print();"`, replaced with a `.js-print-gift-card` class + `addEventListener('click', ...)` binding inside the existing DOMContentLoaded handler. Also added `type="button"` on the button.
- **`snippets/facets-mobile.liquid`**: removed inline `onclick="document.querySelector('.click-capture').click()"` on the mobile "Apply" button; bound via `addEventListener` in a small scoped IIFE.

### Phase 13 - Tooling configs

- **`.theme-check.yml`** (new): Shopify Theme Check config extending `:theme_app_extension`. Enables `ImgLazyLoading`, `ImgWidthAndHeight`, `ParserBlockingScript`, `RemoteAsset`, `UnusedAssign`, `UnusedSnippet`, `UndefinedObject`, deprecation checks, and asset-size thresholds (120 KB JS / 200 KB CSS). Ignores `context/`, `node_modules/`, `dist/`, `build/`.
- **`package.json`** (new): devDependencies (`@shopify/cli`, `@shopify/theme`, `@shopify/prettier-plugin-liquid`, `prettier`, `husky`, `lint-staged`), npm scripts (`theme:dev`, `theme:push`, `theme:pull`, `theme:check`, `format`, `format:check`, `lint`, `prepare`), and `lint-staged` config. Pinned to Node >= 18.17.
- **`.prettierrc`** + **`.prettierignore`** (new): Prettier with the Liquid plugin, 120-col print width, LF line endings, singleQuote JS / doubleQuote Liquid. Ignores `locales/`, `config/settings_data.json`, minified assets, `context/`, build dirs.
- **`.editorconfig`** (new): UTF-8, LF, final newline, trim trailing whitespace. Tabs by default in `.liquid`, spaces in JSON/YAML/MD.
- **`.gitattributes`** (new): normalizes text files to `eol=lf`, declares binary extensions (images, fonts, video, pdf).
- **`.shopifyignore`** (new): prevents the Shopify CLI from uploading `context/`, tooling configs, docs, CI configs, node_modules, and editor metadata to the store.
- **`shopify.theme.toml`** (new): three environments (`development`, `staging`, `production`) with per-env `store`, `theme`, and `ignore` lists. `development` additionally ignores `config/settings_data.json` to avoid overwriting merchant changes during dev.
- **`.gitignore`**: expanded from just `context/` to cover `node_modules/`, logs, `.env*` (keeping `.env.example`), OS / editor junk, `.shopify/`, build caches, and `.husky/_`.
- **`.vscode/extensions.json`** + **`.vscode/settings.json`** (new): recommends Shopify Theme Check + Prettier + EditorConfig + Liquid extensions and enforces format-on-save + LF.

### Phase 14 - Docs

- **`README.md`**: rewritten from a one-line stub into a full project README covering requirements, getting started (`npm install` + CLI auth + `theme:dev`), project layout, development workflow, tooling, performance architecture (lazy-hydrate runtime, banner-shared CSS, image sizing), accessibility (dialog roles, focus trap, no inline handlers), security (Liquid escaping, URL scheme validation, `textContent` over `innerHTML`, https-only social links), a release runbook, and a troubleshooting section.
- **`CONTRIBUTING.md`** (new): ground rules (no `config/settings_data.json` churn, no `context/`, no inline `onclick`, no `innerHTML` with user data, always `| escape` user-reflected Liquid), setup instructions, branching (`feat/*`, `fix/*`, rebase not merge), commit style, PR checklist (lint, smoke test, Lighthouse, image attrs, lazy hydration, locales, changelog), instructions for adding a new section / component, localization rules, and a responsible-disclosure note for security.

### Phase 15 - CI + Husky

- **`.github/workflows/theme-check.yml`** (new): GitHub Actions workflow on `push` / `pull_request` to `main`. Uses Node 20, runs `npm ci || npm install`, then `npm run format:check`, then `npx shopify theme check --fail-level=error`. Fails the build on Prettier drift or any Theme Check `error`-level rule.
- **`.husky/pre-commit`** (new): runs `npx lint-staged` so Prettier auto-formats staged `.liquid` / `.js` / `.css` / `.scss` / `.json` / `.md` / `.yml` files before the commit is recorded. Hook is activated by `npm install` via the `prepare` script (`husky install`).

### Phase 16 - Verification + tag

- All touched files pass the linter (`ReadLints` clean across the Phase 12-15 edits, plus all previously verified Phase 9-11 edits).
- Manual smoke-test plan (run on a duplicated theme in Shopify admin before publishing):
  1. Home page: hero banner still renders eager + high priority, no duplicate banner CSS, Instagram stories still open and trap focus (Tab stays inside the modal, Escape closes it).
  2. Cart drawer: opens, traps focus, Escape closes, and `aria-hidden` toggles correctly.
  3. Search drawer: opens and closes, search input `value` shows the user's term safely even if the term contains `"<>` characters.
  4. Product page: variant picker still updates option labels (now via `textContent`), shipping estimator renders rates / errors as text only, reviews slideshow still honors `max_lines`.
  5. Comment form (any article): try submitting with `<script>` in the body/author/email/URL; confirm it renders escaped and any bad URL becomes plain text.
  6. Collection page with mobile filters: tap the new `js-mobile-filters-apply` button; the click-capture still closes the filter drawer.
  7. Gift card template: print button still triggers `window.print()` via the new `addEventListener` binding.
  8. Map section: confirm Google Maps API only loads when the map enters the viewport.
  9. Bundle deals / promo popup / comparison slider / internal video / insta-stories: confirm each hydrates on scroll via `SeqesLazy` (check Network tab: asset request fires just before the element enters view).
  10. Address book: add/edit an address; confirm all fields round-trip through the form without breaking when user types `<`, `>`, `&`, or quotes.
- Post-hardening Lighthouse run (mobile, 4x CPU throttle) to be compared against `v-post-optimization`; performance should be flat-or-better, accessibility score should rise measurably due to dialog / focus-trap / aria-label / image sizing improvements.
- After sign-off, tag: `git tag -a v-post-hardening -m "Production hardening pass complete"`.

---

## Unreleased - Deep performance optimization

### Phase 0 - Safety net

- Created git tag `v-pre-optimization` at commit `6abb1a6` as rollback point.
- Added this `CHANGELOG.md`.

### Phase 1 - Quick wins

- **`layout/theme.liquid`**: replaced `script_tag` filter (non-deferred) with `<script src="..." defer="defer">` for `vendor.min.js`, `animations.min.js`, `slideshow.js`, `app.js`. Wrapped GSAP bootstrap in `DOMContentLoaded` so it runs after the deferred `animations.min.js` loads.
- **`sections/header.liquid`**: `header.js` switched from `script_tag` to deferred script tag.
- **`sections/main-collection-product-grid.liquid`** and **`sections/main-search.liquid`**: `nouislider.js` deferred (previously blocking).
- **`snippets/photoswipe.liquid`**: PhotoSwipe and PhotoSwipe UI scripts now deferred.
- **Hero LCP**: `image-banner.liquid` and `parallax-hero.liquid` switched background/banner hero images from `loading: 'lazy'` to `loading: 'eager'` + `fetchpriority: 'high'` so the Largest Contentful Paint image starts downloading immediately.
- **`snippets/head-preload.liquid`**: `slideshow.js` preload is now gated to templates that can host a slideshow (`index`, `product`, any `page*`), saving priority bandwidth on cart/account/order-status pages.
- **`sections/image-banner.liquid`**: removed duplicated `<style>` block that rendered the entire `.banner*` base layout ruleset twice per banner instance (every home page banner was shipping ~6 KB of duplicate CSS inline).

### Phase 2 - Lazy hydration

- **`assets/lazy-hydrate.js`** (new): tiny dependency-free helper (~2 KB) that registers `SeqesLazy.register({ id, selector, assets, onReady })`. Uses `IntersectionObserver` (with `rootMargin: 300px`) to defer asset loading until the matching element approaches the viewport, and falls back to immediate hydration on browsers without `IntersectionObserver`.
- **`layout/theme.liquid`**: loads `lazy-hydrate.js` early with `defer`, before other deferred scripts, so any `SeqesLazy.register(...)` calls in sections queue during HTML parse and flush at `DOMContentLoaded`.
- **`assets/insta-stories.js`** (new): extracted the 15 KB inline custom element from `sections/insta-stories.liquid`. Previously every page with Instagram stories shipped this JS inline in the HTML payload; now it is a cacheable asset.
- **`sections/insta-stories.liquid`**: replaced the inline `InstaStories` class body with a `SeqesLazy.register({ id:'insta-stories', selector:'insta-stories', assets:['insta-stories.js'], rootMargin:'400px 0px' })` stub. The heavy JS now loads only when the stories strip is about to enter the viewport.
- **Hotfix**: section-level `SeqesLazy.register(...)` calls run during HTML parsing, before the deferred `lazy-hydrate.js` boots. Added a synchronous inline bootstrap stub in `layout/theme.liquid` that creates `window.SeqesLazy = { _queue: [], register(e){ this._queue.push(e); } }`, and updated `assets/lazy-hydrate.js` to drain `window.SeqesLazy._queue` when it initializes. Without this fix, Instagram stories and the lazy slideshow registration silently no-op'd and story thumbnails didn't open when clicked.

### Phase 3 - CSS critical split

- **`assets/material-symbols.css`** (new): extracted the Material Symbols `@font-face` (hitting fonts.gstatic.com) and the `.material-symbols-outlined` / `.material-icon` helper classes out of the large inline `<style>` block in `layout/theme.liquid`.
- **`layout/theme.liquid`**: loads `material-symbols.css` with the `media="print" onload="this.media='all'"` non-blocking pattern plus a `<noscript>` fallback. The font itself is `font-display: swap`, so icon text stays visible in fallback until the font downloads. Net effect: the critical HTML payload is smaller and the Material font no longer contends with the main app.css download for render-blocking priority.

### Phase 4 - Asset gating

- **`layout/theme.liquid`**: `slideshow.js` (13 KB) no longer loads globally. Replaced the unconditional `<script src defer>` with a `SeqesLazy.register({ id:'slideshow', selector:'slide-show', assets:['slideshow.js'], rootMargin:'400px 0px' })`. On pages without a `<slide-show>` element (cart, account, most collection pages) the script is never fetched; on pages that have one the script is loaded lazily a little before the element scrolls in.
- **`layout/theme.liquid`**: switched `theme-editor.js` and `free-shipping.js` from the `script_tag` filter to explicit `<script src defer>` for consistency with the rest of Phase 1, so they don't block parsing.

### Phase 5 - Third-party strategy

- **`layout/theme.liquid` GTM**: rewrote the Google Tag Manager bootstrap so the `gtm.js` loader is only injected when the main thread is idle (`requestIdleCallback`, 4 s timeout), or on first user interaction (`pointerdown` / `keydown` / `scroll`), or after the `load` event on Safari. `window.dataLayer` is still created synchronously and the `gtm.start` event is still pushed in the same tick so existing `dataLayer.push` calls keep working. This removes one of the largest third-party scripts from the critical path while preserving analytics coverage.

### Phase 6 - Code cleanup

- **`sections/track-order.liquid`**: the 17track third-party script (`externalcall.js`) is no longer loaded synchronously on every page that renders the section. It now loads only on first user interaction with the tracking form (focus on the input as a warm-up, or click on the button). Replaced the blocking `alert("Enter your number.")` with an inline `role="alert"` error message element and rewrote the handler in a dependency-free IIFE. Also wired the form language to `request.locale.iso_code` instead of hardcoded English, and removed the `onclick="doTrack()"` global handler in favor of an `addEventListener` binding scoped to the section id.

### Phase 7 - jQuery removal (optional)

- Skipped. jQuery is bundled inside `assets/vendor.min.js` along with Flickity and other vendor helpers; removing it would require auditing every piece of the theme that depends on `$(...)` (carousels, product drawers, collection tabs) and is too risky relative to the remaining perf headroom after Phases 1-6. Revisit if Lighthouse still reports significant Total Blocking Time from vendor.min.js after this batch of changes.

### Phase 8 - Verification

- All modified files pass the linter.
- Manual smoke-test plan (run on a duplicated theme in Shopify admin before publishing):
  1. Home page: verify the hero image renders immediately with a high-priority request, no double close buttons on mobile banners, and the slideshow still paginates.
  2. Product page (shampoo + crema): confirm Instagram stories hydrate and play when scrolled into view, Klaviyo form embed still renders, and the reviews slideshow respects the `max_lines` setting.
  3. Collection page: verify nouislider-based filters still open and apply correctly.
  4. Search page: confirm filters work.
  5. Track order page: focus the tracking input (17track script should warm up), enter an empty string then click submit (inline error appears instead of `alert`), enter a real number and confirm the carrier widget loads.
  6. Footer: confirm the Klaviyo email signup block still renders and submits.
  7. Verify GTM fires in GA/GTM debug view on first scroll or pointer event.
- Capture post-optimization Lighthouse run (mobile, 4x CPU throttle) and diff the Performance score, LCP, TBT and CLS against the pre-optimization baseline.
- After sign-off, tag the release: `git tag -a v-post-optimization -m "Deep performance optimization complete"`.

---

## Prior customizations (before deep optimization)

These changes were made in earlier sessions and are already committed on branch `dev`.

### Klaviyo integration

- **`layout/theme.liquid`**: removed hardcoded `<script src="klaviyo.js?company_id=TuXrg3">` tag. Klaviyo's onsite script is now injected exclusively by the Klaviyo Shopify app via `{{ content_for_header }}`, which avoids company_id mismatches and double-loading.

### Footer app blocks support

- **`sections/footer.liquid`**: added missing `{% if block.type == '@app' %}` branch in the block render loop. The schema already accepted `@app` blocks but the Liquid ignored them, so Klaviyo Form Embed and other app blocks dropped into the footer silently did not render.

### Email signup block - footer

- **`snippets/email-signup-form.liquid`**: changed the overlapping `field__label` to `visually-hidden` to stop the "Correo electronico" label from overlapping the placeholder. Label kept for screen reader accessibility.
- **`sections/footer.liquid`**: wrapped signup subtitle in `<div class="widget--signup__subtitle rte">` for typography inheritance. Updated schema labels to Title/Subtitle and improved Spanish default copy.
- **`assets/footer.css`**: added placeholder styling (opacity 0.55) and title/subtitle spacing rules for `.widget--signup__title` and `.widget--signup__subtitle`.

### Instagram stories - mobile fixes

- **`sections/insta-stories.liquid`**: inside the mobile media query, added high-specificity override `.insta-stories__modal .insta-stories__modal__close { display: none !important; }` to hide the floating modal close button on mobile (the `mobile-hidden` utility was losing to `display: grid` from later CSS in the same file). Reduced pfp, username, icon, and close button sizes on mobile. Progress bar height reduced.
- **`sections/insta-stories.liquid`**: converted `.insta-story__info__text` to flex layout with `min-width: 0; overflow: hidden` so long usernames truncate with ellipsis instead of wrapping the time-posted label to a second line. `.insta-story__username` gets `white-space: nowrap; text-overflow: ellipsis`; `.insta-story__time-posted` is `flex: 0 0 auto`.

### Reviews slideshow block

- **`snippets/reviews-slideshow-block.liquid`**: added dynamic settings for `max_lines`, `desktop_extra_width`, `mobile_extra_width`. Replaced hardcoded `-webkit-line-clamp: 2` with the `max_lines` variable. Added breakout width via symmetric negative margins with a `max-width: calc(100vw - 1.5rem)` safety clamp on mobile.
- **`sections/main-product.liquid`**: block schema for `reviews_slideshow` gained three settings (`max_lines`, `desktop_extra_width`, `mobile_extra_width`) and the `max_chars` ceiling was raised from 200 to 500 with default bumped to 180.
