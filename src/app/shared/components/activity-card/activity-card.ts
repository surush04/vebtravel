import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activity } from '../../../models';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon';
import { MediaComponent } from '../media/media';

/**
 * Image-led activity card. Used in the expanding showcase on desktop
 * and as a swipeable card on touch devices.
 */
@Component({
  selector: 'app-activity-card',
  imports: [MediaComponent, RouterLink, TranslatePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hover-zoom', '[class.is-active]': 'active()', '[class.is-panel]': 'mode() === "panel"' },
  template: `
    <article class="card">
      <app-media class="card__media" [key]="activity().media" sizes="(min-width: 1024px) 50vw, 85vw" />
      <div class="card__shade" aria-hidden="true"></div>

      <span class="card__index">{{ index() }}</span>
      <span class="card__vertical" aria-hidden="true">{{ 'activities.items.' + activity().id + '.title' | t }}</span>

      <div class="card__body">
        <h3 class="card__title">{{ 'activities.items.' + activity().id + '.title' | t }}</h3>
        <div class="card__reveal">
          <p class="card__text">{{ 'activities.items.' + activity().id + '.summary' | t }}</p>
          <a class="card__link" routerLink="/activities" [fragment]="activity().id">
            {{ 'common.explore' | t }}
            <span class="sr-only">— {{ 'activities.items.' + activity().id + '.title' | t }}</span>
            <app-icon name="arrow" [size]="18" />
          </a>
        </div>
      </div>
    </article>
  `,
  styleUrl: './activity-card.scss',
})
export class ActivityCardComponent {
  readonly activity = input.required<Activity>();
  readonly index = input('01');
  readonly active = input(true);
  readonly mode = input<'card' | 'panel'>('card');
}
