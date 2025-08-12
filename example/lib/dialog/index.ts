// index.ts - Public API exports for the dialog system

export * from './dialog.types';
export * from './dialog.service';
export * from './complex-dialog.component';

// Re-export commonly used types for convenience
export type {
  DialogConfig,
  DialogResult,
  ConfirmationDialogData,
  FormDialogData,
  FormField
} from './dialog.types';
