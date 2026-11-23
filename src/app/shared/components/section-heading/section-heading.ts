import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

/**
 * Editorial section heading: eyebrow, large display title and optional lead.
 * `layout="split"` places the lead beside the title on large screens.
 */
@Component({
  selector: 'app-section-heading',
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-split]': 'layout() === "split"',
    '[class.is-center]': 'layout() === "center"',
  },
  template: `
    <div class="heading__main">
      @if (eyebrow()) {
        <p class="eyebrow" appReveal="fade">{{ eyebrow() }}</p>
      }
      <h2 class="display heading__title" [class.h1]="size() === 'xl'" [class.h2]="size() === 'lg'" [attr.id]="titleId()" appReveal>
        {{ title() }}
      </h2>
    </div>
    @if (lead()) {
      <div class="heading__aside" appReveal [revealDelay]="120">
        <p class="lead">{{ lead() }}</p>
        <ng-content />
      </div>
    }
  `,
  styles: `
    @use 'mixins' as *;
    :host { display: grid; gap: 1.75rem; margin-bottom: clamp(3rem, 6vw, 5.5rem); }
    .heading__main { display: grid; gap: 1.5rem; }
    .heading__aside { display: grid; gap: 1.75rem; justify-items: start; }
    :host(.is-center) { text-align: center; justify-items: center;
      .heading__main, .heading__aside { justify-items: center; }
      .lead { margin-inline: auto; } }
    @include up(lg) {
      :host(.is-split) { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 2rem 6rem; align-items: end; }
      :host(.is-split) .heading__aside { padding-bottom: .5rem; }
    }
  `,
})
export class SectionHeadingComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly lead = input('');
  readonly layout = input<'stack' | 'split' | 'center'>('split');
  readonly size = input<'lg' | 'xl'>('lg');
  readonly titleId = input<string | null>(null);
}
