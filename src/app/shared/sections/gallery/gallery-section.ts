import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { GalleryCategory } from '../../../models';
import { ButtonComponent } from '../../components/button/button';
import { GalleryGridComponent } from '../../components/gallery-grid/gallery-grid';
import { LightboxComponent } from '../../components/lightbox/lightbox';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading';
import { RevealDirective } from '../../directives/reveal.directive';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-gallery-section',
  imports: [
    RouterLink,
    TranslatePipe,
    ButtonComponent,
    GalleryGridComponent,
    LightboxComponent,
    SectionHeadingComponent,
    RevealDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery-section.html',
  styleUrl: './gallery-section.scss',
})
export class GallerySectionComponent {
  /** Limit the number of photos (homepage preview). */
  readonly limit = input<number | null>(null);
  readonly showHeading = input(true);

  private readonly content = inject(ContentService);
  protected readonly categories = this.content.galleryCategories;
  protected readonly filter = signal<GalleryCategory | 'all'>('all');
  protected readonly lightboxIndex = signal<number | null>(null);

  protected readonly items = computed(() => {
    const f = this.filter();
    const all = this.content.gallery();
    const list = f === 'all' ? all : all.filter((g) => g.category === f);
    const limit = this.limit();
    return limit ? list.slice(0, limit) : list;
  });

  protected setFilter(value: GalleryCategory | 'all'): void {
    this.filter.set(value);
  }
}
