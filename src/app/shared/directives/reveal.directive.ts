import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Scroll-triggered reveal. Usage: `<div appReveal>`, `<div appReveal="mask" [revealDelay]="120">`.
 * Hidden state is only applied when the user has not requested reduced motion
 * (see styles/_motion.scss), so content is never lost.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    class: 'reveal',
    '[attr.data-reveal]': 'appReveal() || null',
    '[style.--reveal-delay]': 'revealDelay() + "ms"',
  },
})
export class RevealDirective {
  readonly appReveal = input<'' | 'up' | 'fade' | 'mask'>('');
  readonly revealDelay = input(0);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (!('IntersectionObserver' in window)) {
        el.classList.add('is-revealed');
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0 },
      );
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
