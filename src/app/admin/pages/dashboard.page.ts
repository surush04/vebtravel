import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { L } from '../admin.labels';
import { AdminApi } from '../admin-api.service';
import { AdminStore } from '../admin-store.service';

@Component({
  selector: 'adm-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _rev = store.rev();
    <h1 class="adm-h1">{{ L.nav.dashboard }}</h1>
    <p class="adm-muted adm-intro">
      Аз ин ҷо тамоми мундариҷаи сомона идора мешавад: матнҳо бо се забон (TJ / RU / EN), фаъолиятҳо, маконҳо,
      галерея, аксҳо, маълумоти тамос ва паёмҳои мизоҷон. Пас аз таҳрир тугмаи <strong>«Захира кардан»</strong>-ро
      пахш кунед (ё Ctrl + S). Аксҳо фавран захира мешаванд.
    </p>

    <div class="adm-stats" [attr.data-rev]="_rev">
      @for (s of stats(); track s.label) {
        <a class="adm-stat" [routerLink]="s.link">
          <span class="adm-stat__num">{{ s.value }}</span>
          <span class="adm-stat__label">{{ s.label }}</span>
        </a>
      }
    </div>

    <h2 class="adm-h2">Амалҳои зуд</h2>
    <div class="adm-quick">
      <a class="adm-card adm-quick__item" routerLink="/admin/texts"><strong>¶ {{ L.nav.texts }}</strong><span>Сарлавҳаҳо, матнҳо, SEO — ҳар қисми сомона</span></a>
      <a class="adm-card adm-quick__item" routerLink="/admin/activities"><strong>◆ {{ L.nav.activities }}</strong><span>Илова, таҳрир ва нест кардани фаъолиятҳо</span></a>
      <a class="adm-card adm-quick__item" routerLink="/admin/gallery"><strong>▦ {{ L.nav.gallery }}</strong><span>Бор кардани аксҳо ва категорияҳо</span></a>
      <a class="adm-card adm-quick__item" routerLink="/admin/images"><strong>◐ {{ L.nav.images }}</strong><span>Акси асосӣ (Hero) ва аксҳои бахшҳо</span></a>
      <a class="adm-card adm-quick__item" routerLink="/admin/settings"><strong>⚙ {{ L.nav.settings }}</strong><span>Почта, телефон, WhatsApp, шабакаҳо, парол</span></a>
      <a class="adm-card adm-quick__item" routerLink="/admin/messages"><strong>✉ {{ L.nav.messages }}</strong><span>Дархостҳо аз формаи тамос</span></a>
    </div>
  `,
})
export class DashboardPage {
  protected readonly store = inject(AdminStore);
  private readonly api = inject(AdminApi);
  protected readonly L = L;
  private readonly unread = signal<number | string>('…');

  protected readonly stats = computed(() => {
    this.store.rev();
    const s = this.store.site;
    const photos = Object.keys(this.store.images).length;
    return [
      { label: L.nav.activities, value: s.activities.length, link: '/admin/activities' },
      { label: L.nav.destinations, value: s.destinations.length, link: '/admin/destinations' },
      { label: L.nav.gallery, value: s.gallery.length, link: '/admin/gallery' },
      { label: 'Аксҳои боршуда', value: photos, link: '/admin/images' },
      { label: 'Паёмҳои нав', value: this.unread(), link: '/admin/messages' },
    ];
  });

  constructor() {
    this.api
      .messages()
      .then((m) => this.unread.set(m.filter((x) => !x.read).length))
      .catch(() => this.unread.set('—'));
  }
}
