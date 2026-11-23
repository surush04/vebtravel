import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AboutSectionComponent } from '../../shared/sections/about/about-section';
import { WhySectionComponent } from '../../shared/sections/why/why-section';

@Component({
  selector: 'app-about-page',
  imports: [PageHeroComponent, AboutSectionComponent, WhySectionComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      media="about-main"
      [crumb]="'nav.about' | t"
      [eyebrow]="'pages.about.eyebrow' | t"
      [title]="'pages.about.title' | t"
      [lead]="'pages.about.lead' | t"
    />
    <app-about-section variant="full" />
    <app-why-section />
  `,
})
export class AboutPage {}
