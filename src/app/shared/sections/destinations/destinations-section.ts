import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { IconComponent } from '../../components/icon/icon';
import { MapEmbedComponent } from '../../components/map-embed/map-embed';
import { MediaComponent } from '../../components/media/media';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading';
import { RevealDirective } from '../../directives/reveal.directive';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-destinations-section',
  imports: [
    RouterLink,
    TranslatePipe,
    MediaComponent,
    MapEmbedComponent,
    SectionHeadingComponent,
    RevealDirective,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './destinations-section.html',
  styleUrl: './destinations-section.scss',
})
export class DestinationsSectionComponent {
  readonly showMap = input(true);
  readonly showLink = input(true);

  private readonly content = inject(ContentService);
  protected readonly destinations = this.content.destinations;
  protected readonly map = computed(() => this.content.settings().regionMap);
  protected readonly active = signal(0);
  protected readonly current = computed(
    () => this.destinations()[Math.min(this.active(), this.destinations().length - 1)],
  );

  protected select(i: number): void {
    this.active.set(i);
  }
}
