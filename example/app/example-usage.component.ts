// example-usage.component.ts
import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HlmButton } from "@spartan-ng/helm/button";
import {
  HlmCard,
  HlmCardContent,
  HlmCardDescription,
  HlmCardHeader,
  HlmCardTitle,
} from "@spartan-ng/helm/card";
import { HlmH1, HlmH2, HlmMuted } from "@spartan-ng/helm/typography";

import { ComplexDialogService } from "../lib/dialog/dialog.service";
import { DialogResult } from "../lib/dialog/dialog.types";

/**
 * Example component demonstrating usage of the Complex Dialog system
 * Shows various dialog types and configurations
 */
@Component({
  selector: "app-example-usage",
  standalone: true,
  imports: [
    CommonModule,
    HlmButton,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardDescription,
    HlmCardContent,
    HlmH1,
    HlmH2,
    HlmMuted,
  ],
  template: `
    <div class="container mx-auto p-8 space-y-8 max-w-4xl">
      <!-- Header -->
      <div class="text-center space-y-4">
        <h1 hlmH1>Complex Dialog System</h1>
        <p hlmMuted class="text-lg">
          Built with Spartan UI - Examples of confirmation, form, and custom
          dialogs
        </p>
      </div>

      <!-- Confirmation Dialogs -->
      <hlm-card>
        <hlm-card-header>
          <h2 hlmCardTitle hlmH2>Confirmation Dialogs</h2>
          <p hlmCardDescription>
            Simple and destructive confirmation dialogs with customizable
            messaging
          </p>
        </hlm-card-header>
        <hlm-card-content class="space-y-4">
          <div class="flex flex-wrap gap-4">
            <button hlmBtn (click)="openSimpleConfirmation()">
              Simple Confirmation
            </button>

            <button hlmBtn variant="outline" (click)="openCustomConfirmation()">
              Custom Messages
            </button>

            <button
              hlmBtn
              variant="destructive"
              (click)="openDestructiveDialog()"
            >
              Destructive Action
            </button>

            <button hlmBtn variant="secondary" (click)="openQuickConfirm()">
              Quick Confirm Helper
            </button>
          </div>
        </hlm-card-content>
      </hlm-card>

      <!-- Form Dialogs -->
      <hlm-card>
        <hlm-card-header>
          <h2 hlmCardTitle hlmH2>Form Dialogs</h2>
          <p hlmCardDescription>
            Dynamic form generation with validation and different field types
          </p>
        </hlm-card-header>
        <hlm-card-content class="space-y-4">
          <div class="flex flex-wrap gap-4">
            <button hlmBtn (click)="openContactForm()">Contact Form</button>

            <button hlmBtn variant="outline" (click)="openUserProfileForm()">
              User Profile
            </button>

            <button hlmBtn variant="secondary" (click)="openComplexForm()">
              Complex Form
            </button>

            <button hlmBtn variant="ghost" (click)="openPrefilledForm()">
              Pre-filled Form
            </button>
          </div>
        </hlm-card-content>
      </hlm-card>

      <!-- Advanced Examples -->
      <hlm-card>
        <hlm-card-header>
          <h2 hlmCardTitle hlmH2>Advanced Examples</h2>
          <p hlmCardDescription>Complex scenarios and edge cases</p>
        </hlm-card-header>
        <hlm-card-content class="space-y-4">
          <div class="flex flex-wrap gap-4">
            <button hlmBtn (click)="openLargeDialog()">Large Dialog</button>

            <button hlmBtn variant="outline" (click)="openNonClosableDialog()">
              Non-closable
            </button>

            <button
              hlmBtn
              variant="secondary"
              (click)="openValidationHeavyForm()"
            >
              Heavy Validation
            </button>
          </div>
        </hlm-card-content>
      </hlm-card>

      <!-- Results Display -->
      @if (lastResult()) {
      <hlm-card class="border-green-200 bg-green-50">
        <hlm-card-header>
          <h3 hlmCardTitle class="text-green-800">Last Dialog Result</h3>
        </hlm-card-header>
        <hlm-card-content>
          <pre class="text-sm text-green-700 overflow-auto">{{
            formatResult(lastResult())
          }}</pre>
        </hlm-card-content>
      </hlm-card>
      }
    </div>
  `,
})
export class ExampleUsageComponent {
  private readonly _dialogService = inject(ComplexDialogService);

  protected readonly lastResult = signal<DialogResult | null>(null);

  // Confirmation Dialog Examples

  openSimpleConfirmation() {
    this._dialogService
      .openConfirmation({
        title: "Confirm Action",
        description: "Please confirm your choice",
        data: {
          message: "Are you sure you want to proceed with this action?",
        },
        size: "sm",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  openCustomConfirmation() {
    this._dialogService
      .openConfirmation({
        title: "Save Changes",
        description: "You have unsaved changes",
        data: {
          message:
            "You have unsaved changes that will be lost. Do you want to save them before continuing?",
          confirmText: "Save & Continue",
          cancelText: "Discard Changes",
        },
        size: "md",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  openDestructiveDialog() {
    this._dialogService
      .openConfirmation({
        title: "Delete Account",
        description: "This action cannot be undone",
        data: {
          message:
            "This will permanently delete your account and all associated data. This action cannot be undone.",
          confirmText: "Delete Account",
          cancelText: "Keep Account",
          variant: "destructive",
        },
        size: "md",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  openQuickConfirm() {
    this._dialogService
      .confirm(
        "This is a quick confirmation using the helper method.",
        "Quick Confirm"
      )
      .subscribe((confirmed) => {
        this.lastResult.set({
          action: confirmed ? "confirm" : "cancel",
        });
      });
  }

  // Form Dialog Examples

  openContactForm() {
    this._dialogService
      .openForm({
        title: "Contact Us",
        description: "Send us a message and we'll get back to you",
        data: {
          fields: [
            {
              key: "name",
              label: "Full Name",
              type: "text",
              required: true,
              placeholder: "Enter your full name",
            },
            {
              key: "email",
              label: "Email Address",
              type: "email",
              required: true,
              placeholder: "Enter your email",
            },
            {
              key: "subject",
              label: "Subject",
              type: "text",
              required: true,
              placeholder: "What is this about?",
            },
            {
              key: "message",
              label: "Message",
              type: "textarea",
              required: true,
              placeholder: "Tell us how we can help you",
            },
            {
              key: "newsletter",
              label: "Subscribe to newsletter",
              type: "checkbox",
              placeholder: "Yes, I want to receive updates",
            },
          ],
          submitText: "Send Message",
          cancelText: "Cancel",
        },
        size: "lg",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  openUserProfileForm() {
    this._dialogService
      .openForm({
        title: "Edit Profile",
        description: "Update your profile information",
        data: {
          fields: [
            {
              key: "username",
              label: "Username",
              type: "text",
              required: true,
              validation: (value) => {
                if (!value) return null;
                if (value.length < 3)
                  return "Username must be at least 3 characters";
                if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                  return "Username can only contain letters, numbers, and underscores";
                }
                return null;
              },
            },
            {
              key: "email",
              label: "Email",
              type: "email",
              required: true,
            },
            {
              key: "role",
              label: "Role",
              type: "select",
              required: true,
              options: [
                { label: "Administrator", value: "admin" },
                { label: "Editor", value: "editor" },
                { label: "Viewer", value: "viewer" },
              ],
            },
            {
              key: "bio",
              label: "Bio",
              type: "textarea",
              placeholder: "Tell us about yourself",
            },
          ],
          submitText: "Update Profile",
        },
        size: "md",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  openComplexForm() {
    this._dialogService
      .openForm({
        title: "Complex Form Example",
        description: "Demonstrates all field types and validation",
        data: {
          fields: [
            {
              key: "text_field",
              label: "Text Field",
              type: "text",
              required: true,
              placeholder: "Enter some text",
            },
            {
              key: "email_field",
              label: "Email Field",
              type: "email",
              required: true,
              placeholder: "user@example.com",
            },
            {
              key: "password_field",
              label: "Password Field",
              type: "password",
              required: true,
              validation: (value) => {
                if (!value) return null;
                if (value.length < 8)
                  return "Password must be at least 8 characters";
                if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                  return "Password must contain uppercase, lowercase, and number";
                }
                return null;
              },
            },
            {
              key: "number_field",
              label: "Number Field",
              type: "number",
              placeholder: "Enter a number",
            },
            {
              key: "select_field",
              label: "Select Field",
              type: "select",
              required: true,
              options: [
                { label: "Option 1", value: "opt1" },
                { label: "Option 2", value: "opt2" },
                { label: "Option 3", value: "opt3" },
              ],
            },
            {
              key: "textarea_field",
              label: "Textarea Field",
              type: "textarea",
              placeholder: "Enter multiple lines of text",
            },
            {
              key: "checkbox_field",
              label: "Checkbox Field",
              type: "checkbox",
              placeholder: "I agree to the terms and conditions",
            },
          ],
          submitText: "Submit Complex Form",
        },
        size: "lg",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  openPrefilledForm() {
    this._dialogService
      .openForm({
        title: "Edit Existing Data",
        description: "Form with pre-filled values",
        data: {
          fields: [
            {
              key: "name",
              label: "Name",
              type: "text",
              required: true,
            },
            {
              key: "email",
              label: "Email",
              type: "email",
              required: true,
            },
            {
              key: "role",
              label: "Role",
              type: "select",
              options: [
                { label: "Admin", value: "admin" },
                { label: "User", value: "user" },
              ],
            },
            {
              key: "active",
              label: "Active User",
              type: "checkbox",
            },
          ],
          initialData: {
            name: "John Doe",
            email: "john.doe@example.com",
            role: "user",
            active: true,
          },
          submitText: "Update",
        },
        size: "md",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  // Advanced Examples

  openLargeDialog() {
    this._dialogService
      .openForm({
        title: "Large Dialog Example",
        description: "Demonstrates a dialog with many fields",
        data: {
          fields: Array.from({ length: 10 }, (_, i) => ({
            key: `field_${i + 1}`,
            label: `Field ${i + 1}`,
            type: "text" as const,
            placeholder: `Enter value for field ${i + 1}`,
          })),
          submitText: "Submit All",
        },
        size: "xl",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  openNonClosableDialog() {
    this._dialogService
      .openConfirmation({
        title: "Important Decision",
        description: "This dialog must be answered",
        data: {
          message:
            "This is a critical decision that must be made. You cannot close this dialog without choosing an option.",
          confirmText: "I Accept",
          cancelText: "I Decline",
        },
        closable: false,
        showCloseButton: false,
        size: "md",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  openValidationHeavyForm() {
    this._dialogService
      .openForm({
        title: "Validation Demo",
        description: "Every field has custom validation rules",
        data: {
          fields: [
            {
              key: "username",
              label: "Username",
              type: "text",
              required: true,
              validation: (value) => {
                if (!value) return null;
                if (value.length < 3) return "Minimum 3 characters";
                if (value.length > 20) return "Maximum 20 characters";
                if (!/^[a-zA-Z0-9_]+$/.test(value))
                  return "Only letters, numbers, and underscores";
                return null;
              },
            },
            {
              key: "age",
              label: "Age",
              type: "number",
              required: true,
              validation: (value) => {
                const num = parseInt(value);
                if (isNaN(num)) return "Must be a number";
                if (num < 13) return "Must be at least 13 years old";
                if (num > 120) return "Must be less than 120 years old";
                return null;
              },
            },
            {
              key: "website",
              label: "Website",
              type: "text",
              validation: (value) => {
                if (!value) return null;
                try {
                  new URL(value);
                  return null;
                } catch {
                  return "Must be a valid URL";
                }
              },
            },
          ],
          submitText: "Validate & Submit",
        },
        size: "md",
      })
      .subscribe((result) => {
        this.lastResult.set(result);
      });
  }

  protected formatResult(result: DialogResult): string {
    return JSON.stringify(result, null, 2);
  }
}
