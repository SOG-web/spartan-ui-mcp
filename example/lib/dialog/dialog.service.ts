// dialog.service.ts
import { Injectable, inject, Type } from '@angular/core';
import { Observable } from 'rxjs';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { ComplexDialogComponent } from './complex-dialog.component';
import { 
  DialogConfig, 
  DialogResult, 
  ConfirmationDialogData, 
  FormDialogData,
  DIALOG_SIZE_CLASSES,
  DEFAULT_DIALOG_CONFIG
} from './dialog.types';

/**
 * Service for managing complex dialog interactions with type safety
 * Provides methods for confirmation, form, and custom dialogs
 */
@Injectable({
  providedIn: 'root'
})
export class ComplexDialogService {
  private readonly _hlmDialogService = inject(HlmDialogService);

  /**
   * Opens a confirmation dialog with customizable styling and actions
   * @param config Configuration for the confirmation dialog
   * @returns Observable that emits the user's choice
   */
  openConfirmation(config: DialogConfig<ConfirmationDialogData>): Observable<DialogResult> {
    const dialogConfig = this._mergeConfig(config, { type: 'confirmation' });
    return this._openDialog(dialogConfig);
  }

  /**
   * Opens a form dialog with dynamic field generation and validation
   * @param config Configuration for the form dialog including field definitions
   * @returns Observable that emits form data on submission
   */
  openForm<T = any>(config: DialogConfig<FormDialogData<T>>): Observable<DialogResult<T>> {
    const dialogConfig = this._mergeConfig(config, { type: 'form' });
    return this._openDialog(dialogConfig);
  }

  /**
   * Opens a custom dialog with a provided component
   * @param component The component to render in the dialog
   * @param config Configuration for the custom dialog
   * @returns Observable that emits dialog result
   */
  openCustom<T = any>(
    component: Type<any>,
    config: DialogConfig<T> = {}
  ): Observable<DialogResult<T>> {
    const dialogConfig = this._mergeConfig(config, { type: 'custom' });
    
    const dialogRef = this._hlmDialogService.open(component, {
      context: dialogConfig.data,
      contentClass: this._getContentClass(dialogConfig),
      hasBackdrop: true,
      closeOnBackdropClick: dialogConfig.closable !== false,
      disableClose: dialogConfig.closable === false,
      autoFocus: true,
      restoreFocus: true
    });

    return dialogRef.closed$;
  }

  /**
   * Opens a quick confirmation dialog with minimal configuration
   * @param message The message to display
   * @param title Optional title for the dialog
   * @returns Observable that emits true for confirm, false for cancel
   */
  confirm(message: string, title?: string): Observable<boolean> {
    return new Observable(subscriber => {
      this.openConfirmation({
        title: title || 'Confirm',
        data: { message }
      }).subscribe(result => {
        subscriber.next(result.action === 'confirm');
        subscriber.complete();
      });
    });
  }

  /**
   * Opens a destructive confirmation dialog (for delete actions, etc.)
   * @param message The warning message to display
   * @param title Optional title for the dialog
   * @returns Observable that emits true for confirm, false for cancel
   */
  confirmDestructive(message: string, title?: string): Observable<boolean> {
    return new Observable(subscriber => {
      this.openConfirmation({
        title: title || 'Warning',
        data: { 
          message,
          variant: 'destructive',
          confirmText: 'Delete',
          cancelText: 'Cancel'
        },
        size: 'sm'
      }).subscribe(result => {
        subscriber.next(result.action === 'confirm');
        subscriber.complete();
      });
    });
  }

  /**
   * Private method to open the main dialog component
   */
  private _openDialog<T = any>(config: DialogConfig<T>): Observable<DialogResult<T>> {
    const dialogRef = this._hlmDialogService.open(ComplexDialogComponent, {
      context: config,
      contentClass: this._getContentClass(config),
      hasBackdrop: true,
      closeOnBackdropClick: config.closable !== false,
      disableClose: config.closable === false,
      autoFocus: true,
      restoreFocus: true,
      // Additional Spartan UI dialog options
      role: 'dialog',
      closeOnOutsidePointerEvents: config.closable !== false
    });

    return dialogRef.closed$;
  }

  /**
   * Merges user config with defaults
   */
  private _mergeConfig<T>(config: DialogConfig<T>, overrides: Partial<DialogConfig<T>>): DialogConfig<T> {
    return {
      ...DEFAULT_DIALOG_CONFIG,
      ...config,
      ...overrides
    };
  }

  /**
   * Generates CSS classes for dialog content based on size and custom classes
   */
  private _getContentClass(config: DialogConfig): string {
    const sizeClass = DIALOG_SIZE_CLASSES[config.size || 'md'];
    const customClass = config.contentClass || '';
    
    return `${sizeClass} ${customClass}`.trim();
  }
}
