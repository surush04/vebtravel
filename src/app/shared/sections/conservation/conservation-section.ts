import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../services/translation.service';
import { ButtonComponent } from '../../components/button/button';
import { MediaComponent } from '../../components/media/media';
import { RevealDirective } from '../../directives/reveal.directive';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Item {
  title: string;
  text: string;
}

@Component({
  selector: 'app-conservation-section',
  imports: [RouterLink, TranslatePipe, ButtonComponent, MediaComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conservation-section.html',
  styleUrl: './conservation-section.scss',
})
export class ConservationSectionComponent {
  readonly variant = input<'teaser' | 'full'>('teaser');

  private readonly i18n = inject(TranslationService);
  protected readonly pillars = computed(() => this.i18n.list<Item>('conservation.pillars'));
  protected readonly principles = computed(() => this.i18n.list<Item>('conservation.principles'));
}
