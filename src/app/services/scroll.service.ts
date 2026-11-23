import { DOCUMENT, Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly document = inject(DOCUMENT);

  get reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private get behavior(): ScrollBehavior {
    return this.reducedMotion ? 'auto' : 'smooth';
  }

  toTop(): void {
    window.scrollTo({ top: 0, behavior: this.behavior });
  }

  toElement(target: Element | null): void {
    target?.scrollIntoView({ behavior: this.behavior, block: 'start' });
  }

  /** Lock page scroll (menus, lightbox) without layout shift. */
  lock(locked: boolean): void {
    const body = this.document.body;
    if (locked) {
      const scrollbar = window.innerWidth - this.document.documentElement.clientWidth;
      body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : '';
      body.classList.add('is-locked');
    } else {
      body.style.paddingRight = '';
      body.classList.remove('is-locked');
    }
  }
}
