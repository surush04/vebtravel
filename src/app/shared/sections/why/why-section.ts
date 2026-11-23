import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContentService } from '../../../services/content.service';
import { TranslationService } from '../../../services/translation.service';
import { RevealDirective } from '../../directives/reveal.directive';
import { EditItemDirective } from '../../directives/edit-item.directive';
import { EditAddComponent } from '../../components/edit-add/edit-add';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Reason {
  title: string;
  text: string;
}

@Component({
  selector: 'app-why-section',
  imports: [TranslatePipe, RevealDirective, EditItemDirective, EditAddComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section theme-dark why" aria-labelledby="why-title">
      <div class="container why__layout">
        <div class="why__intro">
          <p class="eyebrow" appReveal="fade">{{ 'why.eyebrow' | t }}</p>
          <h2 id="why-title" class="display h2" appReveal>{{ 'why.title' | t }}</h2>
          <p class="lead" appReveal [revealDelay]="120">{{ 'why.lead' | t }}</p>

          <!-- Derived from the verified founding year (2005) -->
          <div class="why__stat" appReveal [revealDelay]="200">
            <span class="why__years">{{ years() }}</span>
            <span class="why__stat-label">
              <span>{{ 'why.statLabel' | t }}</span>
              <span class="micro">{{ 'why.statSince' | t }}</span>
            </span>
          </div>
        </div>

        <ol class="why__list">
          @for (r of reasons(); track $index) {
            <li class="why__item" appReveal [revealDelay]="$index * 90" [appEditItem]="{ type: 'list', path: 'why.items', index: $index }">
              <span class="why__num">0{{ $index + 1 }}</span>
              <div>
                <h3 class="h3">{{ r.title }}</h3>
                <p>{{ r.text }}</p>
              </div>
            </li>
          }
        </ol>
        <app-edit-add class="why__add" [action]="{ type: 'list', path: 'why.items', shape: ['title', 'text'] }" label="Сабаби нав" />
      </div>
    </section>
  `,
  styleUrl: './why-section.scss',
})
export class WhySectionComponent {
  private readonly i18n = inject(TranslationService);
  private readonly content = inject(ContentService);
  protected readonly years = computed(
    () => new Date().getFullYear() - this.content.settings().established,
  );
  protected readonly reasons = computed(() => this.i18n.list<Reason>('why.items'));
}
