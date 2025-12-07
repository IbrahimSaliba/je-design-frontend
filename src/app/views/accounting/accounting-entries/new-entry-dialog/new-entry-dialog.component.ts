import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface NewEntryDialogData {
  type: 'INCOME' | 'OUTCOME';
  mode?: 'new' | 'view' | 'edit';
  entry?: any; // AccountingEntry for view/edit modes
  hideTypeSelector?: boolean; // For expense-only forms
  hideStatusField?: boolean; // When status is auto-calculated
}

export interface NewEntryFormData {
  type: 'INCOME' | 'OUTCOME';
  amount: number;
  createdDate: Date;
  reason: string;
  settlementDate: Date;
  status: 'PENDING' | 'SETTLED';
}

@Component({
  selector: 'app-new-entry-dialog',
  templateUrl: './new-entry-dialog.component.html',
  styleUrls: ['./new-entry-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ConfirmationDialogComponent
  ]
})
export class NewEntryDialogComponent implements OnInit {
  entryForm: FormGroup;
  selectedType: 'INCOME' | 'OUTCOME' = 'INCOME';
  currentMode: 'new' | 'view' | 'edit' = 'new';

  constructor(
    private dialogRef: MatDialogRef<NewEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewEntryDialogData,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.currentMode = data.mode || 'new';
    this.selectedType = data.type || 'OUTCOME';
    
    this.entryForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required],
      settlementDate: ['', Validators.required],
      status: ['PENDING', data.hideStatusField ? [] : Validators.required], // Not required if hidden
      createdDate: [new Date()]
    });

    // If editing or viewing an existing entry, populate the form
    if (this.currentMode !== 'new' && data.entry) {
      this.populateForm(data.entry);
    }
  }

  ngOnInit(): void {
    // Disable form if in view mode
    if (this.currentMode === 'view') {
      this.entryForm.disable();
    }
  }

  private populateForm(entry: any): void {
    // Determine type based on entry data
    this.selectedType = entry.totalDebit > 0 ? 'INCOME' : 'OUTCOME';
    
    this.entryForm.patchValue({
      amount: entry.totalDebit > 0 ? entry.totalDebit : entry.totalCredit,
      reason: entry.description,
      settlementDate: entry.date,
      status: entry.status,
      createdDate: entry.createdAt
    });
  }

  selectType(type: 'INCOME' | 'OUTCOME'): void {
    this.selectedType = type;
  }

  getDialogTitle(): string {
    switch (this.currentMode) {
      case 'new': return `New ${this.selectedType} Entry`;
      case 'view': return `View ${this.selectedType} Entry`;
      case 'edit': return `Edit ${this.selectedType} Entry`;
      default: return `${this.selectedType} Entry`;
    }
  }

  getDialogIcon(): string {
    switch (this.currentMode) {
      case 'new': return 'add';
      case 'view': return 'visibility';
      case 'edit': return 'edit';
      default: return this.selectedType === 'INCOME' ? 'trending_up' : 'trending_down';
    }
  }

  getSaveButtonText(): string {
    return this.currentMode === 'edit' ? 'Update Entry' : 'Create Entry';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.entryForm.valid) {
      const formData: NewEntryFormData = {
        type: this.selectedType,
        amount: this.entryForm.get('amount')?.value,
        createdDate: this.entryForm.get('createdDate')?.value,
        reason: this.entryForm.get('reason')?.value,
        settlementDate: this.entryForm.get('settlementDate')?.value,
        status: this.entryForm.get('status')?.value
      };

      // Show confirmation dialog
      const isEditMode = this.currentMode === 'edit';
      const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '95vw',
        maxWidth: '400px',
        data: {
          title: isEditMode ? 'Confirm Entry Update' : 'Confirm Entry Creation',
          message: isEditMode 
            ? `Are you sure you want to update this ${this.selectedType} entry for $${formData.amount}?`
            : `Are you sure you want to create this ${this.selectedType} entry for $${formData.amount}?`,
          confirmText: isEditMode ? 'Update Entry' : 'Create Entry',
          cancelText: 'Cancel'
        }
      });

      confirmDialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.dialogRef.close(formData);
        }
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.entryForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field?.hasError('min')) {
      return 'Amount must be greater than 0';
    }
    return '';
  }
}
