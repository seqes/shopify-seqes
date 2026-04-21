/**
 *  @class
 *  @function BackgroundVideo
 */
if (!customElements.get('background-video')) {
	class BackgroundVideo extends HTMLElement {
	  constructor() {
			super();

			this.tl = false;
			this.splittext = false;
	  }
		connectedCallback() {
			let _this = this;
			if ( document.body.classList.contains('animations-true') && typeof gsap !== 'undefined') {
				this.prepareAnimations();
			}
			// Video Support.
			let video_container = this.querySelector('.background-video__iframe');
			if ( video_container ) {
				if ( video_container.querySelector('iframe') ) {
					video_container.querySelector('iframe').onload = function() {
						_this.videoPlay(video_container);
					};
				}
			}
		}
		disconnectedCallback() {
			if ( document.body.classList.contains('animations-true') && typeof gsap !== 'undefined') {
				if (this.tl) this.tl.kill();
				if (this.splittext) this.splittext.revert();
			}
		}
		videoPlay(video_container) {
			setTimeout(() => {
				if (video_container.dataset.provider === 'youtube') {
					video_container.querySelector('iframe').contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: "" }), "*");
				} else if (video_container.dataset.provider === 'vimeo') {
					video_container.querySelector('iframe').contentWindow.postMessage(JSON.stringify({ method: "play" }), "*");
				}
			}, 10);
		}
		prepareAnimations() {
			let section = this;

			const fontsReady = (typeof window.SeqesFontsReady === 'function')
				? window.SeqesFontsReady(1500)
				: (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());

			fontsReady.then(function() {
				let button_offset = 0;

				section.splittext = new SplitText( section.querySelectorAll('h3, p'), {
						type: 'lines, words',
						linesClass: 'line-child'
					}
				);

				section.tl = gsap.timeline({ paused: true });

				if ( section.querySelector('h3')) {
					let h3_duration = 0.7 + ( ( section.querySelectorAll('h3 .line-child div').length - 1 ) * 0.05 );
					section.tl
						.from( section.querySelectorAll('h3 .line-child div'), {
							duration: h3_duration,
							yPercent: '100',
							stagger: 0.05
						}, 0);
					button_offset += h3_duration;
				}
				if ( section.querySelector('p')) {
					let p_duration = 0.7 + ( ( section.querySelectorAll('p .line-child div').length - 1 ) * 0.02 );
					section.tl
						.from( section.querySelectorAll('p .line-child div'), {
							duration: p_duration,
							yPercent: '100',
							stagger: 0.02
						}, 0);
					button_offset += p_duration;
				}
				if ( section.querySelector('.video-lightbox-modal__button')) {
					section.tl
						.fromTo( section.querySelector('.video-lightbox-modal__button'), {
							autoAlpha: 0
						}, {
							duration: 0.5,
							autoAlpha: 1
						}, button_offset * 0.4);
				}

				if (typeof ScrollTrigger !== 'undefined') {
					ScrollTrigger.create({
						trigger: section,
						start: "top center",
						onEnter: function () { section.tl.play(); }
					});
				}

				if (section.getBoundingClientRect().top < window.innerHeight * 0.5) {
					section.tl.play();
				}
			});
		}
	}
	customElements.define('background-video', BackgroundVideo);
}
