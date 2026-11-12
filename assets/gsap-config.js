if (typeof gsap !== 'undefined') {
  gsap.defaults({ ease: Power4.easeOut });
  gsap.config({ nullTargetWarn: false });
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }
}
