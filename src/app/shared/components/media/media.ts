import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { SITE_CONFIG } from '../../../core/config/site.config';
import { MEDIA } from '../../../data/site.data';
import { SceneTone } from '../../../models';
import { MediaService } from '../../../services/media.service';
import { TranslationService } from '../../../services/translation.service';
import { sceneBackground } from './scene';

/**
 * Responsive photograph for a named photo slot.
 *  - Real photo (registered in images/manifest.json): <picture> with AVIF → WebP → JPEG,
 *    srcset/sizes, lazy loading, async decoding, fade-in on load.
 *  - Otherwise: generated mountain artwork placeholder (no network request).
 * Fills its container by default; pass `ratio` (e.g. "4 / 5") to size itself.
 */
@Component({
  selector: 'app-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'media',
    '[class.media--ratio]': '!!ratio()',
    '[class.media--contain]': 'fit() === "contain"',
    '[class.is-loaded]': 'loaded()',
    '[style.aspect-ratio]': 'ratio()',
  },
  template: `
    @if (photo(); as e) {
      <picture>
        @for (format of modernFormats(); track format) {
          <source [attr.type]="'image/' + format" [attr.srcset]="srcset(format)" [attr.sizes]="sizes()" />
        }
        <img
          class="media__img"
          [src]="fallbackSrc()"
          [attr.srcset]="srcset('jpg')"
          [attr.sizes]="sizes()"
          [alt]="alt()"
          [attr.width]="e.width"
          [attr.height]="e.height"
          [attr.loading]="priority() ? 'eager' : 'lazy'"
          [attr.fetchpriority]="priority() ? 'high' : null"
          [style.object-position]="asset()?.focal ?? null"
          decoding="async"
          (load)="loaded.set(true)"
          (error)="failed.set(true)"
        />
      </picture>
    } @else {
      <div
        class="media__scene"
        [style.background-image]="scene()"
        [attr.role]="decorative() ? null : 'img'"
        [attr.aria-label]="decorative() ? null : alt()"
        [attr.aria-hidden]="decorative() ? 'true' : null"
      ></div>
      @if (showLabel) {
        <span class="media__slot" aria-hidden="true">{{ key() }}</span>
      }
    }
  `,
  styleUrl: './media.scss',
})
export class MediaComponent {
  readonly key = input.required<string>();
  readonly sizes = input('100vw');
  readonly priority = input(false);
  readonly fit = input<'cover' | 'contain'>('cover');
  readonly ratio = input<string | null>(null);
  readonly decorative = input(false);

  private readonly media = inject(MediaService);
  private readonly i18n = inject(TranslationService);

  protected readonly showLabel = SITE_CONFIG.showImageSlotLabels;
  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);

  protected readonly asset = computed(() => MEDIA[this.key()]);
  protected readonly photo = computed(() => (this.failed() ? undefined : this.media.entry(this.key())));
  protected readonly alt = computed(() => (this.decorative() ? '' : this.i18n.t(`media.${this.key()}`)));
  protected readonly modernFormats = computed(() =>
    (this.photo()?.formats ?? []).filter((f) => f !== 'jpg'),
  );
  protected readonly fallbackSrc = computed(() => {
    const e = this.photo();
    if (!e) return '';
    const mid = [...e.widths].sort((a, b) => a - b)[Math.floor(e.widths.length / 2)];
    return `images/${this.key()}-${mid}.jpg${this.version()}`;
  });
  protected readonly scene = computed(() => {
    const scene = this.asset()?.scene ?? derivedScene(this.key());
    return sceneBackground(scene.tone, scene.seed);
  });

  private version(): string {
    const v = this.photo()?.v;
    return v ? `?v=${v}` : '';
  }

  protected srcset(format: string): string {
    const e = this.photo();
    if (!e) return '';
    const v = this.version();
    return e.widths.map((w) => `images/${this.key()}-${w}.${format}${v} ${w}w`).join(', ');
  }
}

const TONES: SceneTone[] = ['dawn', 'mist', 'dusk', 'forest', 'snow', 'night'];

/** Stable placeholder art for photo slots created in the admin panel. */
function derivedScene(key: string): { tone: SceneTone; seed: number } {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { tone: TONES[hash % TONES.length], seed: (hash % 997) + 3 };
}
