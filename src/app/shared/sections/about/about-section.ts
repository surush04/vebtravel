import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../services/translation.service';
import { ButtonComponent } from '../../components/button/button';
import { MediaComponent } from '../../components/media/media';
import { TimelineComponent, TimelineEntry } from '../../components/timeline/timeline';
import { RevealDirective } from '../../directives/reveal.directive';
import { EditItemDirective } from '../../directives/edit-item.directive';
import { EditAddComponent } from '../../components/edit-add/edit-add';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Value {
  title: string;
  text: string;
}

@Component({
  selector: 'app-about-section',
  imports: [RouterLink, TranslatePipe, ButtonComponent, MediaComponent, TimelineComponent, RevealDirective, EditItemDirective, EditAddComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about-section.html',
  styleUrl: './about-section.scss',
})
export class AboutSectionComponent {
  /** `teaser` on the homepage (with Learn More), `full` on the About page (with values). */
  readonly variant = input<'teaser' | 'full'>('teaser');

  private readonly i18n = inject(TranslationService);
  protected readonly timeline = computed(() => this.i18n.list<TimelineEntry>('about.timeline'));
  protected readonly values = computed(() => this.i18n.list<Value>('about.values'));
}
