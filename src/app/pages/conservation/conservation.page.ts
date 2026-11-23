import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ActivitiesSectionComponent } from '../../shared/sections/activities/activities-section';
import { ConservationSectionComponent } from '../../shared/sections/conservation/conservation-section';

@Component({
  selector: 'app-conservation-page',
  imports: [PageHeroComponent, ConservationSectionComponent, ActivitiesSectionComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      media="activity-conservation"
      [crumb]="'nav.conservation' | t"
      [eyebrow]="'pages.conservation.eyebrow' | t"
      [title]="'pages.conservation.title' | t"
      [lead]="'pages.conservation.lead' | t"
    />
    <app-conservation-section variant="full" />
    <app-activities-section />
  `,
})
export class ConservationPage {}
