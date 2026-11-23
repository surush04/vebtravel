import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { LanguageCode } from '../../../models';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-large]': 'size() === "large"' },
  template: `
    <div class="lang" role="group" [attr.aria-label]="'a11y.language' | t">
      @for (lang of i18n.languages; track lang.code; let last = $last) {
        <button
          type="button"
          class="lang__btn"
          [class.is-active]="lang.code === i18n.language()"
          [attr.aria-pressed]="lang.code === i18n.language()"
          [attr.lang]="lang.htmlLang"
          [attr.title]="lang.nativeName"
          (click)="select(lang.code)"
        >
          {{ lang.label }}
        </button>
        @if (!last) {
          <span class="lang__sep" aria-hidden="true"></span>
        }
      }
    </div>
  `,
  styles: `
    .lang { display: inline-flex; align-items: center; gap: .15rem; }
    .lang__btn { position: relative; min-width: 2.5rem; min-height: 2.75rem; padding: 0 .35rem;
      font-size: .72rem; font-weight: 600; letter-spacing: .18em; color: inherit; opacity: .6;
      transition: opacity .3s var(--ease-out), color .3s var(--ease-out); }
    .lang__btn::after { content: ''; position: absolute; left: 50%; bottom: .55rem; width: 1rem; height: 1px;
      background: var(--c-gold); transform: translateX(-50%) scaleX(0); transition: transform .4s var(--ease-out); }
    .lang__btn:hover { opacity: 1; }
    .lang__btn.is-active { opacity: 1; color: var(--c-gold); }
    .lang__btn.is-active::after { transform: translateX(-50%) scaleX(1); }
    .lang__sep { width: 1px; height: .8rem; background: currentColor; opacity: .25; }
    :host(.is-large) .lang__btn { min-width: 3.25rem; min-height: 3rem; font-size: .85rem; }
  `,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(TranslationService);
  readonly size = input<'normal' | 'large'>('normal');

  select(code: LanguageCode): void {
    if (code !== this.i18n.language()) void this.i18n.use(code);
  }
}
