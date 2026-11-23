import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContactService } from '../../../services/contact.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon';

/** Floating WhatsApp shortcut — rendered only when a number is configured. */
@Component({
  selector: 'app-whatsapp-fab',
  imports: [TranslatePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (contact.hasWhatsapp()) {
      <a class="fab" [href]="contact.whatsappUrl()" target="_blank" rel="noopener" [attr.aria-label]="'contact.whatsappCta' | t">
        <app-icon name="whatsapp" [size]="26" />
      </a>
    }
  `,
  styles: `
    .fab { position: fixed; right: max(1rem, env(safe-area-inset-right)); bottom: max(1rem, env(safe-area-inset-bottom));
      z-index: 80; display: grid; place-items: center; width: 3.5rem; height: 3.5rem; border-radius: 50%;
      color: var(--c-charcoal); background: var(--c-gold); box-shadow: 0 10px 30px rgba(0,0,0,.35);
      transition: transform .4s var(--ease-out), background-color .4s; }
    .fab:hover { transform: translateY(-3px); background: var(--c-beige); }
  `,
})
export class WhatsappFabComponent {
  protected readonly contact = inject(ContactService);
}
