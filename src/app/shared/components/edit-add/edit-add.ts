import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AddAction, EditService } from '../../../services/edit.service';

/** Visual editor: "+ Add" button placed after a list. Renders nothing outside edit mode. */
@Component({
  selector: 'app-edit-add',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (edit.active() && !edit.preview()) {
      <button type="button" class="edit-add" (click)="add($event)">+ {{ label() }}</button>
    }
  `,
})
export class EditAddComponent {
  readonly action = input.required<AddAction>();
  readonly label = input('Илова кардан');
  protected readonly edit = inject(EditService);

  protected add(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.edit.add(this.action());
  }
}
