import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockAlertService } from '../../../shared/services/stock-alert.service';
import { ReorderSuggestion } from '../../../shared/services/stock-alert.service';

@Component({
  selector: 'app-reorder-dialog',
  templateUrl: './reorder-dialog.component.html',
  styleUrls: ['./reorder-dialog.component.scss'],
  standalone: false
})
export class ReorderDialogComponent implements OnInit {
  reorderForm: FormGroup;
  loading = false;
  suggestion: ReorderSuggestion;

  constructor(
    public dialogRef: MatDialogRef<ReorderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { suggestion: ReorderSuggestion },
    private fb: FormBuilder,
    private stockAlertService: StockAlertService
  ) {
    this.suggestion = data.suggestion;
  }

  ngOnInit() {
    this.reorderForm = this.fb.group({
      quantity: [this.suggestion.suggestedQuantity, [Validators.required, Validators.min(1)]],
      supplier: [this.suggestion.supplier, Validators.required],
      expectedDeliveryDate: ['', Validators.required],
      notes: [''],
      urgent: [this.suggestion.urgency === 'CRITICAL' || this.suggestion.urgency === 'HIGH']
    });

    // Set expected delivery date to lead time from now
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + this.suggestion.leadTime);
    this.reorderForm.patchValue({
      expectedDeliveryDate: expectedDate.toISOString().split('T')[0]
    });
  }

  get estimatedCost(): number {
    const quantity = this.reorderForm.get('quantity')?.value || 0;
    const unitCost = this.suggestion.estimatedCost / this.suggestion.suggestedQuantity;
    return quantity * unitCost;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onCreatePurchaseOrder() {
    if (this.reorderForm.valid) {
      this.loading = true;
      
      const formData = this.reorderForm.value;
      const purchaseOrderData = {
        itemId: this.suggestion.itemId,
        itemName: this.suggestion.itemName,
        itemCode: this.suggestion.itemCode,
        quantity: formData.quantity,
        supplier: formData.supplier,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        notes: formData.notes,
        urgent: formData.urgent,
        estimatedCost: this.estimatedCost
      };

      // Simulate API call
      setTimeout(() => {
        this.loading = false;
        this.dialogRef.close({ success: true, purchaseOrder: purchaseOrderData });
      }, 2000);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
