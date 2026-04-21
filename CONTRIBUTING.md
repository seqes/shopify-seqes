# Contributing to the Seqes Shopify theme

Thanks for helping keep this theme fast, accessible, and secure. Please read
this guide before opening a PR.

## Ground rules

- Do **not** commit `config/settings_data.json` changes that come from editing
  the theme in Shopify admin. Those belong in the admin environment, not in
  source control history as churn.
- Do **not** commit anything in `context/`. It's internal notes only and is
  `.shopifyignore`-ed and `.gitignore`-ed.
- Do **not** add inline `onclick` / `onerror` / `javascript:` handlers. Use
  `addEventListener`. It keeps us CSP-friendly.
- Do **not** call `innerHTML` / `insertAdjacentHTML` with user-controlled or
  API-returned strings. Use `textContent` or DOM APIs.
- Do **not** interpolate Liquid values into HTML attributes without `| escape`
  when they can contain user input (search terms, form fields, metafields,
  comments).

## Getting the repo ready

```bash
npm install
```

This installs Prettier, the Liquid plugin, Husky, `lint-staged`, and the
Shopify CLI locally. `npm install` also runs `husky install`, which wires up
the pre-commit hook at `.husky/pre-commit`.

## Branching

- `main` mirrors the live production theme.
- Feature branches: `feat/<short-description>` or `fix/<short-description>`.
- Rebase (not merge) onto `main` before opening a PR, so history stays linear.

## Commit style

Short, imperative, explain *why* not *what*:

```
fix(cart): use textContent for line errors to prevent XSS

Shopify API may echo raw user strings; switching to textContent avoids
any chance of HTML injection on the cart drawer.
```

## Before pushing a PR

1. Run the formatter + linter:
   ```bash
   npm run lint
   ```
   Both Prettier and Theme Check must pass. If Prettier wants to reformat,
   run `npm run format` and commit the result.
2. Verify locally with the dev server:
   ```bash
   npm run theme:dev
   ```
3. Smoke test on desktop **and** mobile viewports. At minimum:
   - home page scroll + animations
   - PDP variant switch + add to cart
   - cart drawer open/close + focus trap + Escape
   - search drawer open/close
   - collection filters on mobile
   - insta-stories viewer
4. Run Lighthouse on at least the home and a PDP. Don't regress performance
   or accessibility scores.
5. If you touched images or sections with new imagery, confirm each `<img>`
   has `width`, `height`, `loading`, and `sizes` attributes.

## Pull request checklist

Copy this into the PR description and check off what applies:

```
- [ ] `npm run lint` passes locally
- [ ] Smoke tested on desktop + mobile
- [ ] Lighthouse not regressed (Perf / A11y / Best Practices / SEO)
- [ ] No inline event handlers added
- [ ] No innerHTML with untrusted data added
- [ ] All user-reflected Liquid output escaped
- [ ] Images have width/height + responsive srcset where needed
- [ ] Heavy JS added behind SeqesLazy.register
- [ ] New strings added to `locales/en.default.json` (not hardcoded)
- [ ] CHANGELOG.md updated if user-visible
```

## Adding a new section or component

1. Put the section in `sections/` and any Liquid partials in `snippets/`.
2. For component JS, write a small Custom Element in its own `assets/*.js`
   file and register it with `SeqesLazy.register` from the section template.
   Example:
   ```liquid
   <script>
     window.SeqesLazy.register({
       id: 'my-widget',
       selector: 'my-widget',
       assets: ['{{ 'my-widget.js' | asset_url }}']
     });
   </script>
   ```
3. Keep the custom element's CSS in an asset, not inline, unless it depends
   on section settings (e.g. overlay opacity). Inline only the bits that
   genuinely vary per section instance.
4. Every new `{% schema %}` block must have a `name` and be valid JSON (Theme
   Check will verify).

## Localization

Add translation keys to `locales/en.default.json`. Do not hardcode English
strings in templates. Other locales are maintained by the translation team in
Shopify admin.

## Reporting a security issue

Don't open a public GitHub issue. Email the tech lead directly with
reproduction steps. We'll patch, cut a release, and credit you once the fix
is live.
