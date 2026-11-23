import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GalleryItem } from '../../../models';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { EditItemDirective } from '../../directives/edit-item.directive';
import { IconComponent } from '../icon/icon';
import { MediaComponent } from '../media/media';

const RATIOS = { portrait: '4 / 5', landscape: '3 / 2', square: '1 / 1' } as const;

/** Responsive masonry grid (CSS columns) — 1 → 2 → 3 → 4 columns. */
@Component({
  selector: 'app-gallery-grid',
  imports: [MediaComponent, TranslatePipe, IconComponent, EditItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="grid" [attr.aria-label]="'a11y.gallery' | t">
      @for (item of items(); track item.id; let i = $index) {
        <li class="grid__item" [style.--i]="i % 8" [appEditItem]="{ type: 'gallery', id: item.id }">
          <button type="button" class="tile hover-zoom" (click)="open.emit(i)">
            <app-media
              [key]="item.media"
              [ratio]="ratio(item)"
              sizes="(min-width: 1600px) 25vw, (min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"
            />
            <span class="tile__overlay" aria-hidden="true"></span>
            <span class="tile__meta">
              <span class="tile__cat">{{ 'gallery.categories.' + item.category | t }}</span>
              <span class="tile__caption">{{ 'media.' + item.media | t }}</span>
            </span>
            <span class="tile__icon"><app-icon name="expand" [size]="18" /></span>
            <span class="sr-only">{{ 'a11y.openImage' | t }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styleUrl: './gallery-grid.scss',
})
export class GalleryGridComponent {
  readonly items = input.required<GalleryItem[]>();
  readonly open = output<number>();

  protected ratio(item: GalleryItem): string {
    return RATIOS[item.orientation];
  }
}
