import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { L } from '../admin.labels';
import { AdminStore } from '../admin-store.service';
import { ImageFieldComponent } from '../components/image-field';
import { LangFieldComponent } from '../components/lang-field';

const SLOTS = [
  { key: 'hero-markhor', label: 'Акси асосии саҳифаи аввал (Hero)', where: 'Саҳифаи асосӣ · инчунин тасвир барои шабакаҳои иҷтимоӣ', ratio: '16 / 9' },
  { key: 'about-main', label: '«Дар бораи мо» — акси калон', where: 'Саҳифаи асосӣ · саҳифаи «Дар бораи мо»', ratio: '4 / 5' },
  { key: 'about-detail', label: '«Дар бораи мо» — акси хурд', where: 'Саҳифаи асосӣ', ratio: '3 / 4' },
  { key: 'conservation-markhor', label: 'Ҳифзи табиат — акси замина', where: 'Бахши «Ҳифзи табиат»', ratio: '16 / 9' },
  { key: 'conservation-detail', label: 'Ҳифзи табиат — корти мархӯр', where: 'Бахши «Ҳифзи табиат»', ratio: '16 / 10' },
  { key: 'contact-landscape', label: 'Манзараи тамос', where: 'Поёни сомона · саҳифаи «Тамос»', ratio: '16 / 9' },
];

@Component({
  selector: 'adm-images',
  imports: [ImageFieldComponent, LangFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="adm-h1">{{ L.nav.images }}</h1>
    <p class="adm-muted adm-intro">
      Аксҳои калони бахшҳои сомона. Аксҳои фаъолиятҳо, маконҳо ва галерея дар бахшҳои худашон иваз мешаванд.
      Беҳтар аст аксҳо на камтар аз 2400px бар дошта бошанд. Сомона онҳоро худкор ба AVIF/WebP табдил медиҳад.
    </p>
    <div class="adm-images">
      @for (s of slots; track s.key) {
        <article class="adm-card">
          <h2 class="adm-h3">{{ s.label }}</h2>
          <p class="adm-hint">{{ s.where }}</p>
          <adm-image-field [key]="s.key" [ratio]="s.ratio" />
          <adm-lang-field [path]="'media.' + s.key" [label]="L.image.alt" [multiline]="false" />
        </article>
      }
    </div>
  `,
})
export class ImagesPage {
  protected readonly store = inject(AdminStore);
  protected readonly L = L;
  protected readonly slots = SLOTS;
}
