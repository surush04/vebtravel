import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AboutSectionComponent } from '../../shared/sections/about/about-section';
import { ActivitiesSectionComponent } from '../../shared/sections/activities/activities-section';
import { ConservationSectionComponent } from '../../shared/sections/conservation/conservation-section';
import { ContactSectionComponent } from '../../shared/sections/contact/contact-section';
import { DestinationsSectionComponent } from '../../shared/sections/destinations/destinations-section';
import { GallerySectionComponent } from '../../shared/sections/gallery/gallery-section';
import { HeroSectionComponent } from '../../shared/sections/hero/hero-section';
import { WhySectionComponent } from '../../shared/sections/why/why-section';

@Component({
  selector: 'app-home-page',
  imports: [
    HeroSectionComponent,
    AboutSectionComponent,
    ActivitiesSectionComponent,
    DestinationsSectionComponent,
    ConservationSectionComponent,
    GallerySectionComponent,
    WhySectionComponent,
    ContactSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero-section />
    <app-about-section variant="teaser" />
    <app-activities-section />
    <app-destinations-section />
    <app-conservation-section variant="teaser" />
    <app-gallery-section [limit]="8" />
    <app-why-section />
    <app-contact-section />
  `,
})
export class HomePage {}
