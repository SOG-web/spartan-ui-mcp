// dialog.types.ts
export interface DialogConfig<T = any> {
  title?: string;
  description?: string;
  type?: 'confirmation' | 'form' | 'custom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closable?: boolean;
  data?: T;
  contentClass?: string;
  overlayClass?: string;
}

export interface ConfirmationDialogData {
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export interface FormDialogData<T = any> {
  fields: FormField[];
  submitText?: string;
  cancelText?: string;
  initialData?: T;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: (value: any) => string | null;
}

export interface DialogResult<T = any> {
  action: 'confirm' | 'cancel' | 'submit' | 'close';
  data?: T;
}

/**
 * Configuration options for different dialog types
 */
export type DialogTypeConfig<T> = T extends 'confirmation'
  ? DialogConfig<ConfirmationDialogData>
  : T extends 'form'
  ? DialogConfig<FormDialogData>
  : DialogConfig;

/**
 * Utility type for dialog size classes
 */
export const DIALOG_SIZE_CLASSES = {
  sm: 'sm:max-w-[425px]',
  md: 'sm:max-w-[500px]',
  lg: 'sm:max-w-[700px]',
  xl: 'sm:max-w-[900px]'
} as const;

/**
 * Default dialog configuration
 */
export const DEFAULT_DIALOG_CONFIG: Partial<DialogConfig> = {
  size: 'md',
  closable: true,
  showCloseButton: true,
  type: 'custom'
};
