import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { L } from '../admin.labels';
import { AdminApi } from '../admin-api.service';
import { AdminStore } from '../admin-store.service';

interface Field {
  path: string;
  label: string;
  hint?: string;
  type?: 'text' | 'number' | 'url' | 'email' | 'tel';
}

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: 'Маълумоти тамос',
    fields: [
      { path: 'contact.email', label: 'Почтаи электронӣ', type: 'email' },
      { path: 'contact.phone', label: 'Телефон', hint: 'Масалан: +992 00 000 0000', type: 'tel' },
      { path: 'contact.whatsapp', label: 'WhatsApp', hint: 'Танҳо рақамҳо, бо рамзи кишвар: 992XXXXXXXXX. Тугмаи WhatsApp худкор пайдо мешавад.', type: 'tel' },
    ],
  },
  {
    title: 'Шабакаҳои иҷтимоӣ',
    fields: [
      { path: 'social.0.url', label: 'Instagram', type: 'url' },
      { path: 'social.1.url', label: 'Facebook', type: 'url' },
      { path: 'social.2.url', label: 'YouTube', type: 'url' },
      { path: 'social.3.url', label: 'Telegram', type: 'url' },
    ],
  },
  {
    title: 'Харитаҳо',
    fields: [
      { path: 'location.mapEmbedUrl', label: 'Харитаи офис (embed URL)', hint: 'Агар пур шавад, дар бахши «Тамос» харита нишон дода мешавад.', type: 'url' },
      { path: 'location.mapLink', label: 'Пайванди харитаи офис', type: 'url' },
      { path: 'regionMap.embedUrl', label: 'Харитаи минтақаи Дарвоз (embed URL)', type: 'url' },
      { path: 'regionMap.link', label: 'Пайванди харитаи минтақа', type: 'url' },
    ],
  },
  {
    title: 'Умумӣ',
    fields: [
      { path: 'established', label: 'Соли таъсис', hint: 'Барои ҳисоби «… сол дар кӯҳҳои Дарвоз».', type: 'number' },
      { path: 'siteUrl', label: 'Домени сомона', hint: 'Масалан: https://www.m-sayyod.tj (барои SEO).', type: 'url' },
      { path: 'heroVideo.mp4', label: 'Видеои Hero — MP4 (ихтиёрӣ)', hint: 'Пайванд ба файли видео. Агар пур шавад, ба ҷои акси асосӣ видео нишон дода мешавад.', type: 'url' },
      { path: 'heroVideo.webm', label: 'Видеои Hero — WebM (ихтиёрӣ)', type: 'url' },
    ],
  },
];

@Component({
  selector: 'adm-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _rev = store.rev();
    <h1 class="adm-h1">{{ L.nav.settings }}</h1>
    <p class="adm-muted adm-intro">Майдонҳои холӣ дар сомона пинҳон ё ҳамчун «Ба наздикӣ эълон мешавад» нишон дода мешаванд.</p>

    @for (g of groups; track g.title) {
      <section class="adm-card" [attr.data-rev]="_rev">
        <h2 class="adm-h3">{{ g.title }}</h2>
        <div class="adm-grid-2">
          @for (f of g.fields; track f.path) {
            <label class="adm-input">
              <span class="adm-label">{{ f.label }}</span>
              <input [type]="f.type ?? 'text'" [value]="value(f.path)" (input)="update(f, $event)" />
              @if (f.hint) { <span class="adm-hint">{{ f.hint }}</span> }
            </label>
          }
        </div>
      </section>
    }

    <section class="adm-card">
      <h2 class="adm-h3">Иваз кардани парол</h2>
      <form class="adm-grid-2" (submit)="changePassword($event)">
        <label class="adm-input"><span class="adm-label">Пароли ҳозира</span><input type="password" name="current" autocomplete="current-password" required /></label>
        <label class="adm-input"><span class="adm-label">Пароли нав (ҳадди ақал 8 аломат)</span><input type="password" name="next" autocomplete="new-password" minlength="8" required /></label>
        <label class="adm-input"><span class="adm-label">Такрори пароли нав</span><input type="password" name="confirm" autocomplete="new-password" minlength="8" required /></label>
        <div class="adm-input adm-input--end">
          <button class="adm-btn adm-btn--primary" type="submit">Иваз кардан</button>
        </div>
      </form>
      @if (pwMessage()) { <p [class]="pwOk() ? 'adm-success' : 'adm-error'">{{ pwMessage() }}</p> }
    </section>
  `,
})
export class SettingsPage {
  protected readonly store = inject(AdminStore);
  private readonly api = inject(AdminApi);
  protected readonly L = L;
  protected readonly groups = GROUPS;
  protected readonly pwMessage = signal('');
  protected readonly pwOk = signal(false);

  protected value(path: string): string {
    const v = this.store.setting(path);
    return v === null || v === undefined ? '' : String(v);
  }

  protected update(field: Field, event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    let value: string | number | null = raw || null;
    if (field.type === 'number') value = raw ? Number(raw) : 0;
    if (field.path === 'contact.whatsapp' && raw) value = raw.replace(/\D/g, '');
    this.store.setSetting(field.path, value);
  }

  async changePassword(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).value;
    if (get('next') !== get('confirm')) {
      this.pwOk.set(false);
      this.pwMessage.set('Паролҳои нав мувофиқ нестанд.');
      return;
    }
    try {
      await this.api.changePassword(get('current'), get('next'));
      form.reset();
      this.pwOk.set(true);
      this.pwMessage.set('Парол иваз шуд.');
    } catch (e) {
      this.pwOk.set(false);
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      this.pwMessage.set(status === 403 ? 'Пароли ҳозира нодуруст аст.' : status === 400 ? 'Пароли нав хеле кӯтоҳ аст.' : L.saveError);
    }
  }
}
