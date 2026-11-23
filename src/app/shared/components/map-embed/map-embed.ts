import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ButtonComponent } from '../button/button';
import { IconComponent } from '../icon/icon';

/**
 * Privacy- and performance-friendly map: shows a stylised topographic poster
 * and only loads the third-party iframe after the visitor asks for it.
 */
@Component({
  selector: 'app-map-embed',
  imports: [TranslatePipe, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map" [style.aspect-ratio]="ratio()">
      @if (loaded()) {
        <iframe class="map__frame" [src]="safeUrl()" [title]="title()" loading="lazy"
          referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      } @else {
        <div class="map__poster">
          <svg class="map__contours" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            @for (d of contours; track $index) {
              <path [attr.d]="d" />
            }
          </svg>
          <div class="map__content">
            <app-icon name="pin" [size]="28" class="map__pin" />
            <p class="map__title">{{ title() }}</p>
            <button appButton variant="outline" type="button" (click)="loaded.set(true)">{{ 'destinations.mapLoad' | t }}</button>
            <p class="map__notice">{{ 'destinations.mapNotice' | t }}</p>
          </div>
        </div>
      }
    </div>
    @if (link()) {
      <a class="text-link map__link" [href]="link()" target="_blank" rel="noopener">
        {{ 'destinations.mapOpen' | t }} <app-icon name="external" [size]="16" />
      </a>
    }
  `,
  styleUrl: './map-embed.scss',
})
export class MapEmbedComponent {
  readonly url = input.required<string>();
  readonly link = input<string | null>(null);
  readonly title = input('');
  readonly ratio = input('16 / 9');

  private readonly sanitizer = inject(DomSanitizer);
  protected readonly loaded = signal(false);
  protected readonly safeUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.url()),
  );

  /** Concentric, irregular contour lines — a quiet nod to topographic maps. */
  protected readonly contours = (() => {
    const paths: string[] = [];
    const centres = [
      [250, 230, 9],
      [600, 320, 7],
    ];
    for (const [cx, cy, rings] of centres) {
      for (let i = 1; i <= rings; i++) {
        const radius = i * 34;
        let d = '';
        for (let s = 0; s <= 72; s++) {
          const a = (s / 72) * Math.PI * 2;
          const k = 1 + 0.16 * Math.sin(3 * a + i * 0.4 + cx) + 0.07 * Math.sin(5 * a + i * 0.9) + 0.04 * Math.sin(9 * a + cy);
          const x = cx + Math.cos(a) * radius * k * 1.25;
          const y = cy + Math.sin(a) * radius * k * 0.85;
          d += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        paths.push(d + 'Z');
      }
    }
    return paths;
  })();
}
