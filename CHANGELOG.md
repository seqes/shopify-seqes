# Changelog

Theme: Reformation (SEQES customization)

All notable modifications made on top of the original Reformation theme are documented here, so that future Reformation updates can be merged manually with minimal conflict.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates in ISO 8601.

Git tags:

- `v-pre-optimization` - baseline snapshot before the deep performance refactor. Use `git reset --hard v-pre-optimization` to revert all optimization work.

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
