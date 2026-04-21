/*!
 * lazy-hydrate.js
 *
 * Tiny helper that defers the loading of non-critical JS / CSS assets until
 * one of the following happens:
 *   1. An element matching a configured CSS selector is close to the
 *      viewport (IntersectionObserver).
 *   2. The browser is idle (requestIdleCallback fallback).
 *   3. The first user interaction (scroll / pointerdown / keydown) after a
 *      short delay, used as a last-resort fallback in browsers without
 *      IntersectionObserver.
 *
 * Usage:
 *   window.SeqesLazy.register({
 *     // Unique key so we never load the same asset twice.
 *     id: 'insta-stories',
 *     // Any of the following may be provided. If a selector is provided and
 *     // nothing in the current document matches, the entry is dropped.
 *     selector: 'insta-stories',
 *     // Assets can be a single string or an array. Strings ending in .css
 *     // are injected as <link rel="stylesheet">, everything else as
 *     // <script defer>.
 *     assets: ['{{ "insta-stories.js" | asset_url }}'],
 *     // Optional callback, fired once all assets finish loading.
 *     onReady: function () {}
 *   });
 *
 * The helper is deliberately dependency-free and < 2 KB minified.
 */
(function () {
  'use strict';

  // Drain any registrations queued by the inline bootstrap stub in
  // layout/theme.liquid. Sections may call SeqesLazy.register(...) from
  // inline scripts that run during HTML parsing, which is BEFORE this
  // deferred file executes. Without the bootstrap stub those calls would
  // silently no-op.
  var earlyQueue = (window.SeqesLazy && window.SeqesLazy._queue) || [];

  var loaded = Object.create(null);
  var queue = [];
  var flushed = false;

  function loadAsset(url) {
    if (loaded[url]) return loaded[url];
    loaded[url] = new Promise(function (resolve, reject) {
      var isCss = /\.css(\?|$)/i.test(url);
      var node;
      if (isCss) {
        node = document.createElement('link');
        node.rel = 'stylesheet';
        node.href = url;
      } else {
        node = document.createElement('script');
        node.src = url;
        node.defer = true;
      }
      node.onload = function () { resolve(url); };
      node.onerror = function () { reject(new Error('Failed to load ' + url)); };
      document.head.appendChild(node);
    });
    return loaded[url];
  }

  function hydrate(entry) {
    if (entry._hydrated) return;
    entry._hydrated = true;
    var assets = [].concat(entry.assets || []);
    Promise.all(assets.map(loadAsset)).then(function () {
      if (typeof entry.onReady === 'function') {
        try { entry.onReady(); } catch (err) {
          if (window.console) console.error('[lazy-hydrate]', entry.id, err);
        }
      }
    }).catch(function (err) {
      if (window.console) console.warn('[lazy-hydrate]', entry.id, err);
    });
  }

  function observeEntry(entry) {
    if (!entry.selector) { hydrate(entry); return; }
    var targets = document.querySelectorAll(entry.selector);
    if (!targets.length) { return; }

    if (!('IntersectionObserver' in window)) {
      hydrate(entry);
      return;
    }

    var io = new IntersectionObserver(function (entries, observer) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          observer.disconnect();
          hydrate(entry);
          return;
        }
      }
    }, { rootMargin: entry.rootMargin || '300px 0px' });

    targets.forEach(function (t) { io.observe(t); });
  }

  function flush() {
    if (flushed) return;
    flushed = true;
    for (var i = 0; i < queue.length; i++) observeEntry(queue[i]);
  }

  function register(entry) {
    if (!entry || !entry.id) return;
    if (loaded['__entry_' + entry.id]) return;
    loaded['__entry_' + entry.id] = true;
    queue.push(entry);
    if (flushed) observeEntry(entry);
  }

  window.SeqesLazy = {
    register: register,
    load: loadAsset
  };

  for (var qi = 0; qi < earlyQueue.length; qi++) register(earlyQueue[qi]);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', flush, { once: true });
  } else {
    flush();
  }
})();
