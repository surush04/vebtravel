import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../services/content.service';
import { TranslationService } from '../../services/translation.service';
import { ButtonComponent } from '../../shared/components/button/button';
import { MediaComponent } from '../../shared/components/media/media';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { WhySectionComponent } from '../../shared/sections/why/why-section';

@Component({
  selector: 'app-activities-page',
  imports: [
    RouterLink,
    TranslatePipe,
    PageHeroComponent,
    MediaComponent,
    ButtonComponent,
    RevealDirective,
    WhySectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activities.page.html',
  styleUrl: './activities.page.scss',
})
export class ActivitiesPage {
  protected readonly i18n = inject(TranslationService);
  protected readonly activities = inject(ContentService).activities;

  /** Optional note — shown only when it has text in the active language. */
  protected note(id: string): string {
    return this.i18n.optional(`activities.items.${id}.note`);
  }

  protected points(id: string): string[] {
    return this.i18n.list<string>(`activities.items.${id}.points`);
  }
}
