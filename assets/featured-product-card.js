/**
 *  @class
 *  @function FeaturedProductCard
 */

if (!customElements.get('featured-product-card')) {
  class FeaturedProductCard extends HTMLElement {
    constructor() {
      super();

      this.tl = false;
      this.splittext = false;
    }
    connectedCallback() {
      if (document.body.classList.contains('animations-true') && typeof gsap !== 'undefined') {
        this.prepareAnimations();
      }
    }
    disconnectedCallback() {
      if (document.body.classList.contains('animations-true') && typeof gsap !== 'undefined') {
        if (this.tl) this.tl.kill();
        if (this.splittext) this.splittext.revert();
      }
    }
    prepareAnimations() {
      let section = this,
        property = (gsap.getProperty("html", "--header-height") + gsap.getProperty("html", "--header-offset")) + 'px';

      const fontsReady = (typeof window.SeqesFontsReady === 'function')
        ? window.SeqesFontsReady(1500)
        : (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());

      fontsReady.then(function () {
        let button_offset = 0;

        section.splittext = new SplitText(section.querySelectorAll('.featured-product-card--heading, p:not(.subheading)'), {
          type: 'lines, words',
          linesClass: 'line-child'
        });

        section.tl = gsap.timeline({ paused: true });

        if (section.querySelector('.subheading')) {
          section.tl
            .fromTo(section.querySelector('.subheading'), {
              opacity: 0
            }, {
              duration: 0.75,
              opacity: 0.6
            }, 0);

          button_offset += 0.5;
        }
        if (section.querySelector('.featured-product-card--heading')) {
          let h3_duration = 0.8 + ((section.querySelectorAll('.featured-product-card--heading .line-child div').length - 1) * 0.08);
          section.tl
            .set(section.querySelector('.featured-product-card--heading'), {
              visibility: 'visible'
            }, 0)
            .from(section.querySelectorAll('.featured-product-card--heading .line-child div'), {
              duration: h3_duration,
              yPercent: '100',
              stagger: 0.08
            }, 0);
          button_offset += h3_duration;
        }
        if (section.querySelector('.rte p')) {
          let p_duration = 0.8 + ((section.querySelectorAll('.rte p .line-child div').length - 1) * 0.02);
          section.tl
            .set(section.querySelectorAll('.rte p'), {
              visibility: 'visible'
            }, 0)
            .from(section.querySelectorAll('.rte p .line-child div'), {
              duration: p_duration,
              yPercent: '100',
              stagger: 0.02
            }, 0);
          button_offset += p_duration;
        }
        if (section.querySelectorAll('.button').length) {
          let i = 1;
          section.querySelectorAll('.button').forEach((item) => {
            section.tl.fromTo(item, {
              autoAlpha: 0
            }, {
              duration: 0.5,
              autoAlpha: 1
            }, ((button_offset * 0.4) + (i - 1) * 0.1));
            i++;
          });
        }

        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.create({
            trigger: section,
            start: "top center",
            onEnter: function () { section.tl.play(); }
          });
        }

        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          section.tl.play();
        }

        setTimeout(function () {
          if (section.tl && !section.tl.isActive() && section.tl.progress() === 0) {
            const r = section.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) {
              section.tl.progress(1);
            }
          }
        }, 2500);
      });

      setTimeout(function () {
        section.querySelectorAll('.featured-product-card--heading, .rte p, .subheading, .button').forEach(function (el) {
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
            el.style.visibility = 'visible';
            el.style.opacity = '';
          }
        });
      }, 3000);

      if (section.querySelector('.thb-parallax-image')) {
        gsap.fromTo(section.querySelectorAll('.thb-parallax-image'), {
          y: '-8%'
        }, {
          y: '8%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            scrub: 1,
            start: () => `top bottom`,
            end: () => `bottom top+=${property}`,
            onUpdate: () => {
              property = (gsap.getProperty("html", "--header-height") + gsap.getProperty("html", "--header-offset")) + 'px';
            }
          }
        });
      }
    }
  }
  customElements.define('featured-product-card', FeaturedProductCard);
}