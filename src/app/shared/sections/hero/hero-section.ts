import { ChangeDetectionStrategy, Component, ElementRef, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { ScrollService } from '../../../services/scroll.service';
import { TranslationService } from '../../../services/translation.service';
import { ButtonComponent } from '../../components/button/button';
import { MediaComponent } from '../../components/media/media';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-hero-section',
  imports: [RouterLink, TranslatePipe, ButtonComponent, MediaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSectionComponent {
  private readonly i18n = inject(TranslationService);
  private readonly scroll = inject(ScrollService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly content = inject(ContentService);
  protected readonly video = computed(() => this.content.settings().heroVideo);
  protected readonly hasVideo = computed(() => !!(this.video().mp4 || this.video().webm));
  protected readonly autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected readonly lines = computed(() => this.i18n.t('hero.title').split('\n'));

  scrollDown(): void {
    this.scroll.toElement(this.host.nativeElement.nextElementSibling);
  }
}
