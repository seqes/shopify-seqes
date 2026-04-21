/* comparison-slider.js - custom element for the "Before & After slider" section.
 * Extracted from inline <script> in sections/comparison-slider.liquid for
 * caching and lazy hydration.
 */
if (!customElements.get('comparison-slider')) {
  class ComparisonSlider extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('.comparison-slider__input');
      this.overlay = this.querySelector('.comparison-slider__overlay');
      this.line = this.querySelector('.comparison-slider__line');
      if (!this.input) return;
      this.input.addEventListener('input', () => this.update());
      this.update();
    }

    update() {
      const v = this.input.value + '%';
      if (this.overlay) this.overlay.style.width = v;
      if (this.line) this.line.style.left = v;
    }
  }
  customElements.define('comparison-slider', ComparisonSlider);
}
