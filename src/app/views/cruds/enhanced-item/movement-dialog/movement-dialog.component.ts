import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { InventoryMovementsService, InventoryMovementRequest, ItemSummary } from '../inventory-movements.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface MovementDialogData {
  type: 'IN' | 'OUT';
  item?: ItemSummary;
  items?: ItemSummary[];
  isBulk: boolean;
}

@Component({
  selector: 'app-movement-dialog',
  templateUrl: './movement-dialog.component.html',
  styleUrls: ['./movement-dialog.component.scss'],
  standalone: false
})
export class MovementDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  selectedItems: ItemSummary[] = [];

  constructor(
    public dialogRef: MatDialogRef<MovementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovementDialogData,
    private fb: FormBuilder,
    private inventoryService: InventoryMovementsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.updateFormBasedOnType();
  }

  private initForm(): void {
    this.form = this.fb.group({
      itemId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0.01)]],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      relatedInvoiceId: [''],
      relatedContainerId: [''],
      notes: [''],
      movementDate: [new Date(), Validators.required]
    });
  }

  private updateFormBasedOnType(): void {
    if (this.data.item) {
      this.form.patchValue({
        itemId: this.data.item.id,
        unitPrice: this.getDefaultUnitPrice()
      });
    }

    if (this.data.isBulk) {
      this.selectedItems = [...(this.data.items || [])];
    }
  }

  private getDefaultUnitPrice(): number {
     if (this.data.item) {
       // Calculate average unit price from stock value
       return this.data.item.totalValue / (this.data.item.currentStock || 1);
     }
    return 0;
  }

  getTitle(): string {
    if (this.data.isBulk) {
      return `Bulk Stock ${this.data.type} - ${this.selectedItems.length} Items`;
    }
    return `Stock ${this.data.type}${this.data.item ? ` - ${this.data.item.name}` : ''}`;
  }

  getIcon(): string {
    return this.data.type === 'IN' ? 'inventory' : 'remove_shopping_cart';
  }

  getColor(): string {
    return this.data.type === 'IN' ? 'green' : 'red';
  }

  onItemSelectionChanged(items: ItemSummary[]): void {
    this.selectedItems = items;
  }

  onSubmit(): void {
    if (this.form.invalid || (this.data.isBulk && this.selectedItems.length === 0)) {
      this.showValidationError();
      return;
    }

    this.loading = true;

    if (this.data.isBulk) {
      this.processBulkMovement();
    } else {
      this.processSingleMovement();
    }
  }

  private processSingleMovement(): void {
    const formValue = this.form.value;
    
    const movement: InventoryMovementRequest = {
      itemId: formValue.itemId,
      type: this.data.type,
      quantity: formValue.quantity,
      unitPrice: formValue.unitPrice,
      relatedInvoiceId: formValue.relatedInvoiceId || undefined,
      relatedContainerId: formValue.relatedContainerId || undefined
    };

    this.inventoryService.createMovement(movement).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(`${this.data.type} movement created successfully`, 'Close', { duration: 3000 });
        this.dialogRef.close(response);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(`Error creating movement: ${error.message}`, 'Close', { duration: 5000 });
      }
    });
  }

  private processBulkMovement(): void {
    const formValue = this.form.value;
    const bulkMovement = selectedItems.map(item => ({
      itemId: item.id,
      type: this.data.type,
      quantity: formValue.quantity,
      unitPrice: formValue.unitPrice,
      relatedInvoiceId: formValue.relatedInvoiceId || undefined,
      relatedContainerId: formValue.relatedContainerId || undefined
    }));

    // Process bulk movements sequentially to avoid overwhelming the server
    this.processSequentialMovements(bulkMovement, 0);
  }

  private processSequentialMovements(movements: InventoryMovementRequest[], index: number): void {
    if (index >= movements.length) {
      this.loading = false;
      this.snackBar.open(`${movements.length} ${this.data.type} movements created successfully`, 'Close', { duration: 3000 });
      this.dialogRef.close(true);
      return;
    }

    this.inventoryService.createMovement(movements[index]).subscribe({
      next: () => {
        // Process next movement
        setTimeout(() => {
          this.processSequentialMovements(movements, index + 1);
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(`Error creating movement for item at index ${index}: ${error.message}`, 'Close', { duration: 5000 });
      }
    });
  }

  private showValidationError(): void {
    if (this.data.isBulk && this.selectedItems.length === 0) {
      this.snackBar.open('Please select at least one item', 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

   getFieldError(fieldName: string): string {
     const field = this.form.get(fieldName);
     if (field && field.errors) {
       if (field.errors['required']) {
         return `${fieldName} is required`;
       }
       if (field.errors['min']) {
         return `${fieldName} must be greater than ${field.errors['min'].min}`;
       }
     }
     return '';
   }

   getSelectedItemName(): string {
     if (this.data.item) {
       return this.data.item.name;
     }
     const itemId = this.form.get('itemId')?.value;
     const allItems = [...(this.data.items || []), this.data.item].filter(Boolean);
     const selectedItem = allItems.find(item => item.id === itemId);
     return selectedItem?.name || 'Unknown Item';
   }

   getSelectedItemCode(): string {
     if (this.data.item) {
       return this.data.item.code;
     }
     const itemId = this.form.get('itemId')?.value;
     const allItems = [...(this.data.items || []), this.data.item].filter(Boolean);
     const selectedItem = allItems.find(item => item.id === itemId);
     return selectedItem?.code || 'N/A';
   }

   getCurrentStock(): number {
     if (this.data.item) {
       return this.data.item.currentStock;
     }
     const itemId = this.form.get('itemId')?.value;
     const allItems = [...(this.data.items || []), this.data.item].filter(Boolean);
     const selectedItem = allItems.find(item => item.id === itemId);
     return selectedItem?.currentStock || 0;
   }

   getCurrentValue(): number {
     if (this.data.item) {
       return this.data.item.totalValue;
     }
     const itemId = this.form.get('itemId')?.value;
     const allItems = [...(this.data.items || []), this.data.item].filter(Boolean);
     const selectedItem = allItems.find(item => item.id === itemId);
     return selectedItem?.totalValue || 0;
   }

   getTotalValue(): number {
     const quantity = this.form.get('quantity')?.value || 0;
     const unitPrice = this.form.get('unitPrice')?.value || 0;
     return quantity * unitPrice;
   }
}
