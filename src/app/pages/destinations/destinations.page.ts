import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DestinationsSectionComponent } from '../../shared/sections/destinations/destinations-section';
import { GallerySectionComponent } from '../../shared/sections/gallery/gallery-section';

@Component({
  selector: 'app-destinations-page',
  imports: [PageHeroComponent, DestinationsSectionComponent, GallerySectionComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      media="dest-darvoz"
      [crumb]="'nav.destinations' | t"
      [eyebrow]="'pages.destinations.eyebrow' | t"
      [title]="'pages.destinations.title' | t"
      [lead]="'pages.destinations.lead' | t"
    />
    <app-destinations-section [showLink]="false" />
    <app-gallery-section [limit]="8" />
  `,
})
export class DestinationsPage {}
