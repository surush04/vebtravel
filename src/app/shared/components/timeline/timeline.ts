import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

export interface TimelineEntry {
  year: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-timeline',
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (heading()) {
      <h3 class="micro timeline__heading" appReveal="fade">{{ heading() }}</h3>
    }
    <ol class="timeline">
      @for (entry of entries(); track $index) {
        <li class="timeline__item" appReveal [revealDelay]="$index * 140">
          <span class="timeline__dot" aria-hidden="true"></span>
          <p class="timeline__year">{{ entry.year }}</p>
          <h4 class="h4 timeline__title">{{ entry.title }}</h4>
          <p class="timeline__text">{{ entry.text }}</p>
        </li>
      }
    </ol>
  `,
  styles: `
    @use 'mixins' as *;
    :host { display: block; }
    .timeline__heading { margin-bottom: 2.5rem; }
    .timeline { position: relative; display: grid; gap: 2.75rem; padding-left: 1.75rem; }
    .timeline::before { content: ''; position: absolute; left: 0; top: .6rem; bottom: .6rem; width: 1px; background: var(--line); }
    .timeline__item { position: relative; display: grid; gap: .55rem; }
    .timeline__dot { position: absolute; left: calc(-1.75rem - 4px); top: .55rem; width: 9px; height: 9px;
      border-radius: 50%; background: var(--bg); border: 1px solid var(--c-gold); }
    .timeline__item:first-child .timeline__dot { background: var(--c-gold); }
    .timeline__year { font-family: var(--font-display); font-size: clamp(2.2rem, 4vw, 3.4rem); font-weight: 300;
      line-height: 1; color: var(--accent-text); }
    .timeline__text { color: var(--fg-muted); max-width: 26em; }
    @include up(md) {
      .timeline { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3rem; padding-left: 0; padding-top: 2.5rem; }
      .timeline::before { left: 0; right: 0; top: 0; bottom: auto; width: auto; height: 1px; }
      .timeline__dot { left: 0; top: calc(-2.5rem - 4px); }
    }
  `,
})
export class TimelineComponent {
  readonly heading = input('');
  readonly entries = input.required<TimelineEntry[]>();
}
