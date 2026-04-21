/* promo-popup.js - custom element for the "Promo popup" section.
 * Extracted from inline <script> in sections/promo-popup.liquid for caching
 * and lazy hydration.
 */
if (!customElements.get('promo-popup')) {
  class PromoPopup extends HTMLElement {
    connectedCallback() {
      this.testMode = this.dataset.testMode === 'true';
      this.delayDays = parseInt(this.dataset.delayDays, 10) || 7;
      this.delaySeconds = parseInt(this.dataset.delaySeconds, 10) || 3;
      this.displayTimer = this.dataset.displayTimer === 'true';
      this.timerDuration = parseInt(this.dataset.timerDuration, 10) || 300;
      this.storageKey = 'promo-popup-' + location.host;
      this.overlay = this.querySelector('.popup-overlay');
      this.modal = this.querySelector('.popup-modal');
      this.closeBtns = this.querySelectorAll('.promp-popup__close-btn');

      this.closeBtns.forEach((btn) => btn.addEventListener('click', () => this.close()));

      if (this.testMode) return;
      let stored = null;
      try {
        stored = localStorage.getItem(this.storageKey);
      } catch (e) {
        stored = null;
      }
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.dismissed) {
            const diff = Date.now() - data.timestamp;
            if (diff < this.delayDays * 86400000) return;
          }
          if (data.subscribed) return;
        } catch (e) {
          // ignore malformed storage
        }
      }
      setTimeout(() => this.open(), this.delaySeconds * 1000);
    }

    open() {
      if (this.overlay) this.overlay.classList.add('popup-overlay--active');
      if (this.modal) this.modal.classList.add('popup-modal--active');
      if (this.displayTimer) this.startTimer();
    }

    close() {
      if (this.overlay) this.overlay.classList.remove('popup-overlay--active');
      if (this.modal) this.modal.classList.remove('popup-modal--active');
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify({ dismissed: true, timestamp: Date.now() })
        );
      } catch (e) {
        // storage may be unavailable (private mode); ignore
      }
    }

    startTimer() {
      let remaining = this.timerDuration;
      const mEl = this.querySelector('.popup-modal__timer__minutes');
      const sEl = this.querySelector('.popup-modal__timer__seconds');
      if (!mEl || !sEl) return;
      const tick = () => {
        if (remaining <= 0) return;
        remaining--;
        mEl.textContent = String(Math.floor(remaining / 60)).padStart(2, '0');
        sEl.textContent = String(remaining % 60).padStart(2, '0');
      };
      tick();
      this._timer = setInterval(tick, 1000);
    }

    disconnectedCallback() {
      if (this._timer) clearInterval(this._timer);
    }
  }
  customElements.define('promo-popup', PromoPopup);
}
