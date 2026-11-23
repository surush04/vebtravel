import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Interim M-SAYYOD wordmark: a mountain "M" crowned by spiral Markhor horns.
 * Replace the <svg> with the official logo artwork when it is supplied.
 */
@Component({
  selector: 'app-logo',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="22.5" class="ring" />
      <path class="horn" d="M21.4 21.3c-1.6-1.9-3.9-2.2-4.3-4.6-.4-2.3 1.9-3 1.5-5.3-.3-1.8-2.2-2.7-2.6-4.6" />
      <path class="horn" d="M26.6 21.3c1.6-1.9 3.9-2.2 4.3-4.6.4-2.3-1.9-3-1.5-5.3.3-1.8 2.2-2.7 2.6-4.6" />
      <path class="peak" d="M9.5 34.5 18 23.8l6 6.6 6-6.6 8.5 10.7" />
      <path class="base" d="M13 38h22" />
    </svg>
    <span class="word">
      <span class="name">M-SAYYOD</span>
      @if (subtitle()) {
        <span class="sub">{{ 'meta.location' | t }}</span>
      }
    </span>
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: .8rem; color: var(--c-beige); }
    .mark { width: 2.6rem; height: 2.6rem; flex: none; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .ring { stroke: var(--c-gold); stroke-width: .8; opacity: .55; }
    .horn { stroke: var(--c-gold); stroke-width: 1.6; }
    .peak { stroke: currentColor; stroke-width: 1.6; }
    .base { stroke: var(--c-gold); stroke-width: 1; opacity: .7; }
    .word { display: flex; flex-direction: column; line-height: 1; }
    .name { font-family: var(--font-display); font-size: 1.32rem; font-weight: 500; letter-spacing: .2em; }
    .sub { margin-top: .45rem; font-size: .6rem; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; color: var(--c-gold); }
  `,
})
export class LogoComponent {
  readonly subtitle = input(false);
}
