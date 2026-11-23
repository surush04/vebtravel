import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { L } from '../admin.labels';
import { AdminApi, AdminMessage } from '../admin-api.service';
import { AdminStore } from '../admin-store.service';

@Component({
  selector: 'adm-messages',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-pagehead">
      <h1 class="adm-h1">{{ L.nav.messages }}</h1>
      <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="load()">↻ Навсозӣ</button>
    </div>
    <p class="adm-muted adm-intro">Дархостҳое, ки меҳмонон тавассути формаи «Тамос» фиристодаанд.</p>

    @if (error()) { <p class="adm-error">{{ error() }}</p> }

    <div class="adm-chips">
      <button type="button" class="adm-chip" [class.is-active]="!unreadOnly()" (click)="unreadOnly.set(false)">Ҳама ({{ messages().length }})</button>
      <button type="button" class="adm-chip" [class.is-active]="unreadOnly()" (click)="unreadOnly.set(true)">Нахондашуда ({{ unreadCount() }})</button>
    </div>

    <div class="adm-messages">
      @for (m of visible(); track m.id) {
        <article class="adm-card adm-msg" [class.is-unread]="!m.read">
          <header class="adm-msg__head">
            <div>
              <strong class="adm-msg__name">{{ m.name }}</strong>
              <span class="adm-hint">{{ m.date | date: 'dd.MM.yyyy HH:mm' }} · {{ m.language.toUpperCase() }}</span>
            </div>
            @if (!m.read) { <span class="adm-badge adm-badge--gold">Нав</span> }
          </header>
          <dl class="adm-msg__meta">
            <div><dt>Email</dt><dd><a [href]="'mailto:' + m.email">{{ m.email }}</a></dd></div>
            @if (m.phone) { <div><dt>Телефон</dt><dd><a [href]="'tel:' + m.phone">{{ m.phone }}</a></dd></div> }
            @if (m.country) { <div><dt>Кишвар</dt><dd>{{ m.country }}</dd></div> }
            @if (m.activity) { <div><dt>Фаъолият</dt><dd>{{ activityName(m.activity) }}</dd></div> }
          </dl>
          <p class="adm-msg__text">{{ m.message }}</p>
          <footer class="adm-card__foot">
            <a class="adm-btn adm-btn--sm" [href]="'mailto:' + m.email + '?subject=M-SAYYOD'">Ҷавоб додан</a>
            <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="toggleRead(m)">{{ m.read ? 'Ҳамчун нав' : 'Хонда шуд' }}</button>
            <button type="button" class="adm-btn adm-btn--ghost adm-btn--danger adm-btn--sm" (click)="remove(m)">{{ L.delete }}</button>
          </footer>
        </article>
      } @empty {
        <p class="adm-muted">Ҳоло паём нест.</p>
      }
    </div>
  `,
})
export class MessagesPage {
  private readonly api = inject(AdminApi);
  private readonly store = inject(AdminStore);
  protected readonly L = L;
  protected readonly messages = signal<AdminMessage[]>([]);
  protected readonly unreadOnly = signal(false);
  protected readonly error = signal('');

  protected readonly unreadCount = computed(() => this.messages().filter((m) => !m.read).length);
  protected readonly visible = computed(() =>
    this.unreadOnly() ? this.messages().filter((m) => !m.read) : this.messages(),
  );

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      this.messages.set(await this.api.messages());
      this.error.set('');
    } catch {
      this.error.set(L.login.offline);
    }
  }

  protected activityName(id: string): string {
    if (id === 'other') return this.store.text('tg', 'contact.form.activityOther') || id;
    return this.store.text('tg', `activities.items.${id}.title`) || id;
  }

  async toggleRead(m: AdminMessage): Promise<void> {
    const updated = await this.api.markMessage(m.id, !m.read);
    this.messages.update((list) => list.map((x) => (x.id === m.id ? updated : x)));
  }

  async remove(m: AdminMessage): Promise<void> {
    if (!confirm('Ин паём нест карда шавад?')) return;
    await this.api.deleteMessage(m.id);
    this.messages.update((list) => list.filter((x) => x.id !== m.id));
  }
}
