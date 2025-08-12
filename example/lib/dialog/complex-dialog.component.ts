// complex-dialog.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import {
  HlmDialogContent,
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmSelect } from '@spartan-ng/helm/select';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSpinner } from '@spartan-ng/helm/spinner';

import { DialogConfig, DialogResult, FormField } from './dialog.types';

/**
 * Complex dialog component that supports multiple dialog types:
 * - Confirmation dialogs with customizable actions
 * - Form dialogs with dynamic field generation and validation
 * - Custom dialogs with projected content
 */
@Component({
  selector: 'app-complex-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmDialogContent,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmDialogDescription,
    HlmDialogFooter,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    HlmSelect,
    HlmCheckbox,
    HlmIcon,
    HlmSpinner,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <hlm-dialog-header *ngIf="config.title || config.description">
        <h3 hlmDialogTitle *ngIf="config.title">{{ config.title }}</h3>
        <p hlmDialogDescription *ngIf="config.description">
          {{ config.description }}
        </p>
      </hlm-dialog-header>

      <!-- Content -->
      <div class="flex-1 min-h-0">
        <!-- Confirmation Dialog -->
        @if (config.type === 'confirmation') {
          <div class="py-4">
            <p class="text-sm text-muted-foreground">{{ config.data?.message }}</p>
          </div>
        }

        <!-- Form Dialog -->
        @if (config.type === 'form' && formGroup) {
          <div class="space-y-4 py-4 max-h-96 overflow-y-auto">
            <form [formGroup]="formGroup" class="space-y-4">
              @for (field of config.data?.fields; track field.key) {
                <div class="space-y-2">
                  <!-- Field Label -->
                  <label hlmLabel [for]="field.key" class="flex items-center gap-1">
                    {{ field.label }}
                    @if (field.required) {
                      <span class="text-destructive text-xs">*</span>
                    }
                  </label>

                  <!-- Text/Email/Password/Number Input -->
                  @if (['text', 'email', 'password', 'number'].includes(field.type)) {
                    <input
                      hlmInput
                      [id]="field.key"
                      [type]="field.type"
                      [placeholder]="field.placeholder || ''"
                      [formControlName]="field.key"
                      [class.border-destructive]="isFieldInvalid(field.key)"
                    />
                  }

                  <!-- Textarea -->
                  @if (field.type === 'textarea') {
                    <textarea
                      hlmTextarea
                      [id]="field.key"
                      [placeholder]="field.placeholder || ''"
                      [formControlName]="field.key"
                      [class.border-destructive]="isFieldInvalid(field.key)"
                      rows="3"
                      class="resize-none"
                    ></textarea>
                  }

                  <!-- Select -->
                  @if (field.type === 'select') {
                    <select
                      hlmSelect
                      [id]="field.key"
                      [formControlName]="field.key"
                      [class.border-destructive]="isFieldInvalid(field.key)"
                    >
                      <option value="" disabled>
                        Select {{ field.label.toLowerCase() }}
                      </option>
                      @for (option of field.options; track option.value) {
                        <option [value]="option.value">
                          {{ option.label }}
                        </option>
                      }
                    </select>
                  }

                  <!-- Checkbox -->
                  @if (field.type === 'checkbox') {
                    <div class="flex items-center space-x-2">
                      <input
                        hlmCheckbox
                        [id]="field.key"
                        [formControlName]="field.key"
                        type="checkbox"
                      />
                      <label hlmLabel [for]="field.key" class="text-sm font-normal">
                        {{ field.placeholder || field.label }}
                      </label>
                    </div>
                  }

                  <!-- Validation Error -->
                  @if (isFieldInvalid(field.key)) {
                    <div class="text-sm text-destructive flex items-center gap-1">
                      <hlm-icon name="lucideAlertCircle" size="sm" />
                      {{ getFieldError(field) }}
                    </div>
                  }
                </div>
              }
            </form>
          </div>
        }

        <!-- Custom Dialog Content -->
        @if (config.type === 'custom') {
          <div class="py-4">
            <ng-content></ng-content>
          </div>
        }
      </div>

      <!-- Footer -->
      <hlm-dialog-footer>
        <div class="flex gap-2 justify-end">
          <!-- Cancel/Close Button -->
          @if (config.closable !== false) {
            <button
              hlmBtn
              variant="outline"
              [disabled]="loading()"
              (click)="onCancel()"
              type="button"
            >
              {{ getCancelText() }}
            </button>
          }

          <!-- Confirm/Submit Button -->
          <button
            hlmBtn
            [variant]="getConfirmVariant()"
            [disabled]="isSubmitDisabled()"
            (click)="onConfirm()"
            type="button"
            class="min-w-[100px]"
          >
            @if (loading()) {
              <hlm-spinner size="sm" class="mr-2" />
            }
            {{ getConfirmText() }}
          </button>
        </div>
      </hlm-dialog-footer>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class ComplexDialogComponent implements OnInit {
  private readonly _dialogRef = inject<BrnDialogRef<DialogResult>>(BrnDialogRef);
  private readonly _fb = inject(FormBuilder);
  
  protected readonly config = injectBrnDialogContext<DialogConfig>();
  protected formGroup: FormGroup | null = null;
  protected readonly loading = signal(false);

  ngOnInit() {
    if (this.config.type === 'form' && this.config.data?.fields) {
      this.initializeForm();
    }
  }

  /**
   * Initialize reactive form based on field definitions
   */
  private initializeForm() {
    const formControls: { [key: string]: any } = {};
    
    this.config.data.fields.forEach((field: FormField) => {
      const validators = this.buildValidators(field);
      const initialValue = this.getInitialValue(field);
      
      formControls[field.key] = [initialValue, validators];
    });

    this.formGroup = this._fb.group(formControls);
  }

  /**
   * Build validators array for a form field
   */
  private buildValidators(field: FormField) {
    const validators = [];
    
    if (field.required) {
      validators.push(Validators.required);
    }
    
    // Add field-specific validators
    switch (field.type) {
      case 'email':
        validators.push(Validators.email);
        break;
      case 'number':
        validators.push(Validators.pattern(/^\d+$/));
        break;
    }

    // Add custom validator if provided
    if (field.validation) {
      validators.push((control: AbstractControl) => {
        const error = field.validation!(control.value);
        return error ? { custom: error } : null;
      });
    }

    return validators;
  }

  /**
   * Get initial value for a form field
   */
  private getInitialValue(field: FormField) {
    const initialData = this.config.data.initialData;
    if (initialData && field.key in initialData) {
      return initialData[field.key];
    }
    
    return field.type === 'checkbox' ? false : '';
  }

  /**
   * Handle cancel action
   */
  protected onCancel() {
    this._dialogRef.close({
      action: 'cancel'
    });
  }

  /**
   * Handle confirm action
   */
  protected onConfirm() {
    if (this.config.type === 'confirmation') {
      this._dialogRef.close({
        action: 'confirm'
      });
    } else if (this.config.type === 'form') {
      this.onSubmitForm();
    }
  }

  /**
   * Handle form submission
   */
  private onSubmitForm() {
    if (!this.formGroup?.valid) {
      this.formGroup?.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    
    // Simulate async operation - in real app, this would be a service call
    setTimeout(() => {
      this._dialogRef.close({
        action: 'submit',
        data: this.formGroup?.value
      });
    }, 300);
  }

  /**
   * Check if submit button should be disabled
   */
  protected isSubmitDisabled(): boolean {
    if (this.loading()) return true;
    if (this.config.type === 'form') {
      return !this.formGroup?.valid;
    }
    return false;
  }

  /**
   * Check if a form field has validation errors
   */
  protected isFieldInvalid(fieldKey: string): boolean {
    const control = this.formGroup?.get(fieldKey);
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Get cancel button text based on dialog type
   */
  protected getCancelText(): string {
    if (this.config.type === 'confirmation') {
      return this.config.data?.cancelText || 'Cancel';
    }
    if (this.config.type === 'form') {
      return this.config.data?.cancelText || 'Cancel';
    }
    return 'Close';
  }

  /**
   * Get confirm button text based on dialog type
   */
  protected getConfirmText(): string {
    if (this.config.type === 'confirmation') {
      return this.config.data?.confirmText || 'Confirm';
    }
    if (this.config.type === 'form') {
      return this.config.data?.submitText || 'Submit';
    }
    return 'OK';
  }

  /**
   * Get confirm button variant based on dialog configuration
   */
  protected getConfirmVariant(): string {
    if (this.config.type === 'confirmation' && this.config.data?.variant === 'destructive') {
      return 'destructive';
    }
    return 'default';
  }

  /**
   * Get validation error message for a field
   */
  protected getFieldError(field: FormField): string {
    const control = this.formGroup?.get(field.key);
    if (!control?.errors) return '';

    if (control.errors['required']) {
      return `${field.label} is required`;
    }
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (control.errors['pattern']) {
      return field.type === 'number' ? 'Please enter a valid number' : 'Invalid format';
    }
    if (control.errors['custom']) {
      return control.errors['custom'];
    }

    return 'Invalid value';
  }
}
