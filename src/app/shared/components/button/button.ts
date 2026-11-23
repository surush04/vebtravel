import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon';

export type ButtonVariant = 'solid' | 'outline' | 'light';

/**
 * Brand button applied to native elements, keeping full semantics:
 * `<a appButton routerLink="/contact">`, `<button appButton variant="outline">`.
 */
@Component({
  selector: 'a[appButton], button[appButton]',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'btn',
    '[class.btn--solid]': 'variant() === "solid"',
    '[class.btn--outline]': 'variant() === "outline"',
    '[class.btn--light]': 'variant() === "light"',
    '[class.btn--block]': 'block()',
  },
  template: `
    <span class="btn__fill" aria-hidden="true"></span>
    <span class="btn__label"><ng-content /></span>
    @if (icon(); as name) {
      <app-icon class="btn__icon" [name]="name" [size]="18" />
    }
  `,
  styleUrl: './button.scss',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('solid');
  readonly icon = input<IconName | null>('arrow');
  readonly block = input(false);
}
