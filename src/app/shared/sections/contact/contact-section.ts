import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ContentService } from '../../../services/content.service';
import { ContactService } from '../../../services/contact.service';
import { ButtonComponent } from '../../components/button/button';
import { ContactFormComponent } from '../../components/contact-form/contact-form';
import { IconComponent } from '../../components/icon/icon';
import { MapEmbedComponent } from '../../components/map-embed/map-embed';
import { RevealDirective } from '../../directives/reveal.directive';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-contact-section',
  imports: [TranslatePipe, ButtonComponent, ContactFormComponent, IconComponent, MapEmbedComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.scss',
})
export class ContactSectionComponent {
  readonly activity = input<string | undefined>(undefined);

  protected readonly contact = inject(ContactService);
  protected readonly settings = inject(ContentService).settings;

  protected tel(phone: string): string {
    return 'tel:' + phone.replace(/[^+\d]/g, '');
  }
}
