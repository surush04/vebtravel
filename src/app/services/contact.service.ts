import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SITE_CONFIG } from '../core/config/site.config';
import { ContactPayload, ContactResult } from '../models';
import { ContentService } from './content.service';
import { TranslationService } from './translation.service';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(TranslationService);

  private readonly content = inject(ContentService);

  readonly whatsapp = computed(() => this.content.settings().contact.whatsapp);
  readonly hasWhatsapp = computed(() => !!this.whatsapp());

  /**
   * 1. Saves the enquiry via the site API (visible in Admin -> Messages), or
   *    posts JSON to `SITE_CONFIG.formEndpoint` when configured.
   * 2. Otherwise opens WhatsApp with the enquiry pre-filled (if configured).
   * 3. Otherwise reports that online enquiries are not connected yet.
   */
  async submit(payload: ContactPayload): Promise<ContactResult> {
    const endpoint = this.content.api() ? 'api/messages' : SITE_CONFIG.formEndpoint;
    if (endpoint) {
      try {
        await firstValueFrom(
          this.http.post(endpoint, payload, {
            headers: { Accept: 'application/json' },
          }),
        );
        return 'sent';
      } catch {
        return 'error';
      }
    }

    if (this.hasWhatsapp()) {
      window.open(this.whatsappUrl(this.compose(payload)), '_blank', 'noopener');
      return 'whatsapp';
    }

    return 'unconfigured';
  }

  whatsappUrl(message?: string): string {
    const number = (this.whatsapp() ?? '').replace(/\D/g, '');
    const text = message ?? this.i18n.t('contact.whatsappGreeting');
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  }

  private compose(p: ContactPayload): string {
    const t = (k: string) => this.i18n.t(k);
    const activity = p.activity
      ? p.activity === 'other'
        ? t('contact.form.activityOther')
        : t(`activities.items.${p.activity}.title`)
      : '—';
    const details = [
      `${t('contact.form.messageIntro')} — M-SAYYOD`,
      `${t('contact.form.name')}: ${p.name}`,
      `${t('contact.form.email')}: ${p.email}`,
      p.phone && `${t('contact.form.phone')}: ${p.phone}`,
      p.country && `${t('contact.form.country')}: ${p.country}`,
      `${t('contact.form.activity')}: ${activity}`,
    ].filter(Boolean);
    return `${details.join('\n')}\n\n${p.message}`;
  }
}
