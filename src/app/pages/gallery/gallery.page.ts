import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { GallerySectionComponent } from '../../shared/sections/gallery/gallery-section';

@Component({
  selector: 'app-gallery-page',
  imports: [PageHeroComponent, GallerySectionComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      media="gallery-11"
      [crumb]="'nav.gallery' | t"
      [eyebrow]="'pages.gallery.eyebrow' | t"
      [title]="'pages.gallery.title' | t"
      [lead]="'pages.gallery.lead' | t"
    />
    <app-gallery-section [showHeading]="false" />
  `,
})
export class GalleryPage {}
