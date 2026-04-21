/*!
 * focus-trap.js
 *
 * Tiny focus-management helper for modal dialogs. Exposes
 * window.SeqesFocusTrap with two methods:
 *
 *   activate(container, options)
 *     - Moves focus into `container`, remembers the previously focused
 *       element, and traps Tab/Shift+Tab inside the container until
 *       deactivate() is called.
 *     - Optional options:
 *         initialFocus: Element | string (CSS selector within container)
 *         onEscape: function (called when user presses Escape)
 *
 *   deactivate(container)
 *     - Releases the trap and restores focus to the previously focused
 *       element.
 *
 * The helper is dependency-free and intentionally does not hide anything
 * behind `inert` because we want to support older browsers without
 * polyfills. Sufficient for small theme modals.
 */
(function () {
  'use strict';

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  const traps = new WeakMap();

  function getFocusable(container) {
    return Array.prototype.filter.call(
      container.querySelectorAll(FOCUSABLE_SELECTOR),
      function (el) {
        return !el.hasAttribute('hidden') && el.offsetParent !== null;
      }
    );
  }

  function onKeydown(e) {
    const trap = traps.get(e.currentTarget);
    if (!trap) return;

    if (e.key === 'Escape' || e.keyCode === 27) {
      if (typeof trap.onEscape === 'function') {
        trap.onEscape(e);
      }
      return;
    }

    if (e.key !== 'Tab' && e.keyCode !== 9) return;

    const focusable = getFocusable(trap.container);
    if (focusable.length === 0) {
      e.preventDefault();
      trap.container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !trap.container.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function activate(container, options) {
    if (!container || traps.has(container)) return;
    options = options || {};
    const previouslyFocused = document.activeElement;
    const keydownHandler = onKeydown.bind(null);
    traps.set(container, {
      container: container,
      previouslyFocused: previouslyFocused,
      keydownHandler: keydownHandler,
      onEscape: options.onEscape
    });
    container.addEventListener('keydown', keydownHandler);

    let initial = null;
    if (options.initialFocus instanceof Element) {
      initial = options.initialFocus;
    } else if (typeof options.initialFocus === 'string') {
      initial = container.querySelector(options.initialFocus);
    }
    if (!initial) {
      const focusable = getFocusable(container);
      initial = focusable[0] || container;
    }
    if (initial && typeof initial.focus === 'function') {
      try { initial.focus({ preventScroll: true }); } catch (err) { initial.focus(); }
    }
  }

  function deactivate(container) {
    if (!container) return;
    const trap = traps.get(container);
    if (!trap) return;
    container.removeEventListener('keydown', trap.keydownHandler);
    traps.delete(container);
    if (trap.previouslyFocused && typeof trap.previouslyFocused.focus === 'function') {
      try { trap.previouslyFocused.focus({ preventScroll: true }); } catch (err) { trap.previouslyFocused.focus(); }
    }
  }

  window.SeqesFocusTrap = {
    activate: activate,
    deactivate: deactivate,
    getFocusable: getFocusable
  };

  /*
   * Auto-wire focus traps for the theme's existing modals.
   *
   * Side panels (cart-drawer / search-drawer / product-drawer) get `.active`
   * class toggled on `<div class="side-panel">` by app.js. Insta-stories use
   * `[data-open="true"]` on `.insta-stories__modal`.
   *
   * We observe those attribute/class changes and toggle the trap + aria-hidden
   * accordingly. This keeps the existing open/close logic untouched while
   * adding proper accessibility without regressions.
   */
  function observeSidePanels() {
    const panels = document.querySelectorAll('.side-panel');
    panels.forEach(function (panel) {
      let wasActive = panel.classList.contains('active');
      if (wasActive) {
        panel.setAttribute('aria-hidden', 'false');
        activate(panel, {
          onEscape: function () {
            document.dispatchEvent(new CustomEvent('panel:close'));
          }
        });
      }
      const obs = new MutationObserver(function () {
        const isActive = panel.classList.contains('active');
        if (isActive && !wasActive) {
          panel.setAttribute('aria-hidden', 'false');
          activate(panel, {
            onEscape: function () {
              document.dispatchEvent(new CustomEvent('panel:close'));
            }
          });
        } else if (!isActive && wasActive) {
          panel.setAttribute('aria-hidden', 'true');
          deactivate(panel);
        }
        wasActive = isActive;
      });
      obs.observe(panel, { attributes: true, attributeFilter: ['class'] });
    });
  }

  function observeInstaStoryModals() {
    const modals = document.querySelectorAll('.insta-stories__modal');
    modals.forEach(function (modal) {
      let wasOpen = modal.dataset.open === 'true';
      if (wasOpen) {
        modal.setAttribute('aria-hidden', 'false');
        activate(modal, {
          onEscape: function () {
            const closeBtn = modal.querySelector('.insta-stories__close-button');
            if (closeBtn) closeBtn.click();
          }
        });
      }
      const obs = new MutationObserver(function () {
        const isOpen = modal.dataset.open === 'true';
        if (isOpen && !wasOpen) {
          modal.setAttribute('aria-hidden', 'false');
          activate(modal, {
            onEscape: function () {
              const closeBtn = modal.querySelector('.insta-stories__close-button');
              if (closeBtn) closeBtn.click();
            }
          });
        } else if (!isOpen && wasOpen) {
          modal.setAttribute('aria-hidden', 'true');
          deactivate(modal);
        }
        wasOpen = isOpen;
      });
      obs.observe(modal, { attributes: true, attributeFilter: ['data-open'] });
    });
  }

  function init() {
    observeSidePanels();
    observeInstaStoryModals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
