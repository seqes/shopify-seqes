/* bundle-deals.js - custom element for the "bundle deals" section.
 * Extracted from inline <script> in sections/bundle-deals.liquid so it can be
 * cached across page loads and lazy-hydrated via SeqesLazy.
 */
if (!customElements.get('bundle-deals')) {
  class BundleDeals extends HTMLElement {
    connectedCallback() {
      this.checkboxes = this.querySelectorAll('.bundle-deals__checkbox-js');
      this.mediaItems = this.querySelectorAll('.bundle-deals__media-item');
      this.percentageLeft = parseFloat(this.dataset.percentageLeft) || 1;
      this.fixedDiscount = parseFloat(this.dataset.fixedDiscount) || 0;
      this.currencySymbol = this.dataset.currencySymbol || '$';
      this.updatePrices = this.dataset.updatePrices === 'true';
      this.variantSelects = this.querySelectorAll('.bundle-deals__variant-selects-js');

      this.checkboxes.forEach((cb) => {
        cb.addEventListener('change', () => this.onCheckboxChange(cb));
      });

      this.variantSelects.forEach((vs) => {
        const selects = vs.querySelectorAll('select');
        const jsonEl = vs.querySelector('script[type="application/json"]');
        if (!jsonEl) return;
        try {
          vs._variants = JSON.parse(jsonEl.textContent);
        } catch (e) {
          return;
        }
        selects.forEach((s) => s.addEventListener('change', () => this.onVariantChange(vs)));
      });
    }

    onCheckboxChange(cb) {
      const idx = parseInt(cb.dataset.index, 10);
      const checked = cb.checked;
      cb.dataset.checked = checked ? 'true' : 'false';
      if (this.mediaItems[idx]) {
        this.mediaItems[idx].style.opacity = checked ? '1' : '0.3';
      }
      this.recalcTotals();
    }

    onVariantChange(vs) {
      const selects = Array.from(vs.querySelectorAll('select'));
      const combo = selects.map((s) => s.value);
      const variant = vs._variants.find((v) => v.options.every((o, i) => o === combo[i]));
      if (!variant) return;
      const idx = vs.dataset.index;
      const cb = this.querySelector('[data-index="' + idx + '"]');
      if (cb) cb.dataset.id = variant.id;
      const product = this.querySelector('.bundle-deals__product-js:nth-child(' + (parseInt(idx, 10) + 1) + ')');
      if (product) {
        const img = this.mediaItems[parseInt(idx, 10)] && this.mediaItems[parseInt(idx, 10)].querySelector('img');
        if (img && variant.featured_image) img.src = variant.featured_image.src;
      }
      this.recalcTotals();
    }

    recalcTotals() {
      let total = 0,
        totalCompare = 0;
      this.checkboxes.forEach((cb) => {
        if (cb.dataset.checked === 'true') {
          total += parseFloat(cb.dataset.price) || 0;
          totalCompare += parseFloat(cb.dataset.comparePrice) || 0;
        }
      });
      total = total * this.percentageLeft - this.fixedDiscount;
      const fmt = (v) => this.currencySymbol + (v / 100).toFixed(2);
      const tp = this.querySelector('.bundle-deals__total-price-js');
      const tcp = this.querySelector('.bundle-deals__total-compare-price-js');
      if (tp) tp.textContent = fmt(total);
      if (tcp) tcp.textContent = totalCompare > total ? fmt(totalCompare) : '';
      this.updateFormIds();
    }

    updateFormIds() {
      const form = this.querySelector('form[data-type="add-to-cart-form"]');
      if (!form) return;
      const existing = form.querySelectorAll('input[name="items[][id]"]');
      existing.forEach((e) => e.remove());
      this.checkboxes.forEach((cb) => {
        if (cb.dataset.checked === 'true') {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'items[][id]';
          input.value = cb.dataset.id;
          form.prepend(input);
        }
      });
    }
  }
  customElements.define('bundle-deals', BundleDeals);
}
