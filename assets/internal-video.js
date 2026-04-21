/* internal-video.js - custom element that lazy-loads inline <video> tags
 * using IntersectionObserver. Extracted from inline <script> blocks in
 * sections/multirow.liquid (and previously sections/results.liquid) so the
 * logic is cached once across the theme.
 */
if (!customElements.get('internal-video')) {
  class InternalVideo extends HTMLElement {
    connectedCallback() {
      this.video = this.querySelector('video');
      if (!this.video) return;
      const autoplay = this.dataset.autoplay === 'true';
      const sources = this.video.querySelectorAll('source[data-src]');
      if (sources.length === 0 && autoplay) {
        this.video.play().catch(() => {});
        return;
      }
      if (!('IntersectionObserver' in window)) {
        sources.forEach((s) => {
          if (s.dataset.src) {
            s.src = s.dataset.src;
            s.removeAttribute('data-src');
          }
        });
        this.video.load();
        if (autoplay) this.video.play().catch(() => {});
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              sources.forEach((s) => {
                if (s.dataset.src) {
                  s.src = s.dataset.src;
                  s.removeAttribute('data-src');
                }
              });
              this.video.load();
              if (autoplay) this.video.play().catch(() => {});
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(this);
    }
  }
  customElements.define('internal-video', InternalVideo);
}
