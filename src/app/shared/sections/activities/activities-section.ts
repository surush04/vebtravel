import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { ActivityCardComponent } from '../../components/activity-card/activity-card';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading';
import { RevealDirective } from '../../directives/reveal.directive';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-activities-section',
  imports: [RouterLink, TranslatePipe, ActivityCardComponent, SectionHeadingComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activities-section.html',
  styleUrl: './activities-section.scss',
})
export class ActivitiesSectionComponent {
  protected readonly activities = inject(ContentService).activities;
  protected readonly active = signal(0);
  protected readonly progress = signal(0);
  protected readonly current = signal(0);

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  /** Track scroll position of the touch carousel for the progress indicator. */
  protected onTrackScroll(): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const ratio = max > 0 ? el.scrollLeft / max : 0;
    this.progress.set(ratio);
    this.current.set(Math.round(ratio * Math.max(0, this.activities().length - 1)));
  }
}
