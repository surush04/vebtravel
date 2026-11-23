import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../directives/reveal.directive';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MediaComponent } from '../media/media';

/** Cinematic header for interior pages, with breadcrumb. */
@Component({
  selector: 'app-page-hero',
  imports: [MediaComponent, RouterLink, TranslatePipe, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-hero" [attr.aria-labelledby]="'page-title'">
      <div class="page-hero__media">
        <app-media [key]="media()" [priority]="true" sizes="100vw" />
      </div>
      <div class="page-hero__overlay" aria-hidden="true"></div>

      <div class="container page-hero__content">
        <nav class="crumbs" [attr.aria-label]="'a11y.breadcrumb' | t">
          <ol>
            <li><a routerLink="/">{{ 'nav.home' | t }}</a></li>
            <li aria-current="page">{{ crumb() }}</li>
          </ol>
        </nav>
        <p class="eyebrow">{{ eyebrow() }}</p>
        <h1 id="page-title" class="display page-hero__title">
          @for (line of lines(); track $index) {
            <span class="line"><span [style.--i]="$index">{{ line }}</span></span>
          }
        </h1>
        @if (lead()) {
          <p class="lead page-hero__lead" appReveal [revealDelay]="350">{{ lead() }}</p>
        }
      </div>

      <div class="page-hero__meta container" aria-hidden="true">
        <span>{{ 'meta.location' | t }}</span>
        <span class="page-hero__rule"></span>
        <span>{{ 'meta.established' | t }}</span>
      </div>
    </section>
  `,
  styleUrl: './page-hero.scss',
})
export class PageHeroComponent {
  readonly media = input.required<string>();
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly lead = input('');
  readonly crumb = input('');

  protected readonly lines = computed(() => this.title().split('\n'));
}
