import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ContactSectionComponent } from '../../shared/sections/contact/contact-section';

@Component({
  selector: 'app-contact-page',
  imports: [PageHeroComponent, ContactSectionComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      media="contact-landscape"
      [crumb]="'nav.contact' | t"
      [eyebrow]="'pages.contact.eyebrow' | t"
      [title]="'pages.contact.title' | t"
      [lead]="'pages.contact.lead' | t"
    />
    <app-contact-section [activity]="activity()" />
  `,
})
export class ContactPage {
  /** Bound from the `?activity=` query parameter (withComponentInputBinding). */
  readonly activity = input<string | undefined>(undefined);
}
