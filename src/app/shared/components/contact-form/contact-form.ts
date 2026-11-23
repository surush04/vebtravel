import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentService } from '../../../services/content.service';
import { ActivityId, ContactResult } from '../../../models';
import { ContactService } from '../../../services/contact.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ButtonComponent } from '../button/button';

type Status = 'idle' | 'sending' | ContactResult;

const PHONE_PATTERN = /^[+()\d\s-]{6,24}$/;

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactFormComponent {
  /** Pre-select an activity (e.g. from `/contact?activity=hunting`). */
  readonly activity = input<string | undefined>(undefined);

  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly contact = inject(ContactService);
  private readonly i18n = inject(TranslationService);

  protected readonly activities = inject(ContentService).activities;
  protected readonly status = signal<Status>('idle');

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    country: ['', [Validators.maxLength(80)]],
    activity: ['' as ActivityId | 'other' | ''],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(4000)]],
    consent: [false, [Validators.requiredTrue]],
    website: [''], // honeypot — must stay empty
  });

  constructor() {
    effect(() => {
      const preset = this.activity();
      if (preset && this.activities().some((a) => a.id === preset)) {
        this.form.controls.activity.setValue(preset);
      }
    });
  }

  protected invalid(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected error(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!this.invalid(control) || !control.errors) return null;
    const errors = control.errors;
    if (name === 'consent') return 'contact.form.errors.consent';
    if (errors['required']) return 'contact.form.errors.required';
    if (errors['email']) return 'contact.form.errors.email';
    if (errors['pattern']) return 'contact.form.errors.phone';
    if (errors['minlength']) return 'contact.form.errors.minlength';
    return 'contact.form.errors.required';
  }

  async submit(): Promise<void> {
    if (this.status() === 'sending') return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = document.querySelector<HTMLElement>('.cform [aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    const { website, consent, ...values } = this.form.getRawValue();
    if (website) {
      // Bot detected: pretend success, send nothing.
      this.status.set('sent');
      return;
    }

    this.status.set('sending');
    const result = await this.contact.submit({ ...values, language: this.i18n.language() });
    this.status.set(result);
    if (result === 'sent') this.form.reset();
  }
}
