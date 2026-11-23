import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LANGUAGES } from '../../data/site.data';
import { LanguageCode } from '../../models';
import { AdminStore } from '../admin-store.service';

/** One text in three languages (TJ / RU / EN), bound to an i18n path. */
@Component({
  selector: 'adm-lang-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _rev = store.rev();
    <div class="adm-field" [attr.data-rev]="_rev">
      <div class="adm-field__head">
        <span class="adm-label">{{ label() }}</span>
        @if (hint()) { <span class="adm-hint">{{ hint() }}</span> }
      </div>
      <div class="adm-langs">
        @for (l of langs; track l.code) {
          <label class="adm-lang">
            <span class="adm-lang__tag">{{ l.label }}</span>
            @if (isMultiline()) {
              <textarea [value]="value(l.code)" (input)="update(l.code, $event)" [rows]="rows()" [attr.lang]="l.htmlLang"></textarea>
            } @else {
              <input type="text" [value]="value(l.code)" (input)="update(l.code, $event)" [attr.lang]="l.htmlLang" />
            }
          </label>
        }
      </div>
    </div>
  `,
})
export class LangFieldComponent {
  readonly path = input.required<string>();
  readonly label = input('');
  readonly hint = input('');
  /** Force a textarea; by default chosen from the content length. */
  readonly multiline = input<boolean | null>(null);

  protected readonly store = inject(AdminStore);
  protected readonly langs = LANGUAGES;

  protected readonly isMultiline = computed(() => {
    this.store.rev();
    const forced = this.multiline();
    if (forced !== null) return forced;
    return this.langs.some((l) => {
      const v = this.value(l.code);
      return v.length > 70 || v.includes('\n');
    });
  });

  protected readonly rows = computed(() => {
    this.store.rev();
    const longest = Math.max(...this.langs.map((l) => this.value(l.code).length));
    return Math.min(8, Math.max(2, Math.ceil(longest / 60)));
  });

  protected value(lang: LanguageCode): string {
    const v = this.store.text(lang, this.path());
    return typeof v === 'string' ? v : '';
  }

  protected update(lang: LanguageCode, event: Event): void {
    this.store.setText(lang, this.path(), (event.target as HTMLInputElement).value);
  }
}
