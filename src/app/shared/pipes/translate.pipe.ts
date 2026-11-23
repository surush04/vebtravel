import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

/**
 * `{{ 'hero.title' | t }}` — reads the active dictionary signal, so templates
 * update instantly when the language changes.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
