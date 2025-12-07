import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CrudService } from '../crud.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface StockAdjustmentData {
  item: any;
}

@Component({
  selector: 'app-stock-adjustment-dialog',
  templateUrl: './stock-adjustment-dialog.component.html',
  styleUrls: ['./stock-adjustment-dialog.component.scss'],
  standalone: false
})
export class StockAdjustmentDialogComponent implements OnInit {
  adjustmentForm: UntypedFormGroup;
  item: any;
  quantityChange: number = 0;
  loading: boolean = false;
  Math = Math; // Expose Math for template
  
  // Stock alert properties
  predictedStatus: string = '';
  predictedStock: number = 0;
  willBeLowStock: boolean = false;
  willBeOutOfStock: boolean = false;
  statusWillChange: boolean = false;
  minStock: number = 0;

  adjustmentReasons = [
    { value: 'PHYSICAL_COUNT', label: 'Physical Count/Inventory Audit', icon: 'inventory', requiresCost: false },
    { value: 'PURCHASE', label: 'New Purchase/Shipment Received', icon: 'shopping_cart', requiresCost: true },
    { value: 'CUSTOMER_RETURN', label: 'Customer Return', icon: 'assignment_return', requiresCost: false },
    { value: 'SUPPLIER_RETURN', label: 'Return to Supplier', icon: 'local_shipping', requiresCost: false },
    { value: 'DAMAGED', label: 'Damaged/Defective Items', icon: 'broken_image', requiresCost: false },
    { value: 'THEFT_LOSS', label: 'Theft/Loss/Missing', icon: 'warning', requiresCost: false },
    { value: 'EXPIRED_DISPOSAL', label: '📅 Expired Item Disposal', icon: 'event_busy', requiresCost: false },
    { value: 'CORRECTION', label: 'Data Correction/Error Fix', icon: 'edit', requiresCost: false }
  ];

  constructor(
    public dialogRef: MatDialogRef<StockAdjustmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockAdjustmentData,
    private fb: UntypedFormBuilder,
    private crudService: CrudService,
    private snackBar: MatSnackBar
  ) {
    this.item = data.item;
  }

  ngOnInit() {
    // Initialize stock alert properties
    this.minStock = this.item.min_stock || 0;
    this.predictedStock = this.item.total_quantity || 0;
    this.predictedStatus = this.item.status || 'IN_STOCK';
    
    this.adjustmentForm = this.fb.group({
      newQuantity: [this.item.total_quantity || 0, [Validators.required, Validators.min(0)]],
      reason: ['', Validators.required],
      notes: [''],
      unitCost: [this.item.final_price || 0]
    });

    // Listen to quantity changes
    this.adjustmentForm.get('newQuantity')?.valueChanges.subscribe(newQty => {
      this.calculateChange(newQty);
      this.calculateStockAlerts(newQty);
    });

    // Listen to reason changes to show/hide unit cost
    this.adjustmentForm.get('reason')?.valueChanges.subscribe(reason => {
      const unitCostControl = this.adjustmentForm.get('unitCost');
      if (reason === 'PURCHASE') {
        unitCostControl?.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        unitCostControl?.clearValidators();
      }
      unitCostControl?.updateValueAndValidity();
    });
  }

  calculateChange(newQty: number) {
    this.quantityChange = newQty - (this.item.total_quantity || 0);
  }

  calculateStockAlerts(newQty: number) {
    this.predictedStock = newQty;
    const currentStock = this.item.total_quantity || 0;
    const currentStatus = this.item.status || 'IN_STOCK';
    
    // Determine predicted status based on min stock
    if (newQty === 0) {
      this.predictedStatus = 'OUT_OF_STOCK';
    } else if (newQty <= this.minStock) {
      this.predictedStatus = 'LOW_STOCK';
    } else {
      this.predictedStatus = 'IN_STOCK';
    }
    
    // Check if status will change
    this.statusWillChange = currentStatus !== this.predictedStatus;
    
    // Determine alert conditions
    this.willBeOutOfStock = this.predictedStatus === 'OUT_OF_STOCK';
    this.willBeLowStock = this.predictedStatus === 'LOW_STOCK' && !this.willBeOutOfStock;
  }

  getAlertSeverity(): 'error' | 'warn' | 'info' | null {
    if (this.willBeOutOfStock) return 'error';
    if (this.willBeLowStock) return 'warn';
    if (this.statusWillChange) return 'info';
    return null;
  }

  getAlertMessage(): string {
    if (this.willBeOutOfStock) {
      return `⚠️ WARNING: This adjustment will cause OUT OF STOCK!\n\nCurrent: ${this.item.total_quantity || 0} units\nAfter: ${this.predictedStock} units\nMinimum: ${this.minStock} units`;
    }
    if (this.willBeLowStock) {
      return `⚠️ CAUTION: This adjustment will cause LOW STOCK!\n\nAfter: ${this.predictedStock} units\nMinimum: ${this.minStock} units`;
    }
    if (this.statusWillChange) {
      const oldStatus = this.item.status?.replace('_', ' ') || 'Unknown';
      const newStatus = this.predictedStatus.replace('_', ' ');
      return `ℹ️ Status will change: ${oldStatus} → ${newStatus}`;
    }
    return '';
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'OUT_OF_STOCK': return 'text-red-600';
      case 'LOW_STOCK': return 'text-orange-600';
      case 'IN_STOCK': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  getStatusBgColor(status: string): string {
    switch(status) {
      case 'OUT_OF_STOCK': return 'bg-red-100';
      case 'LOW_STOCK': return 'bg-orange-100';
      case 'IN_STOCK': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  }

  getChangeColor(): string {
    if (this.quantityChange > 0) return 'text-green-600';
    if (this.quantityChange < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getChangeIcon(): string {
    if (this.quantityChange > 0) return 'trending_up';
    if (this.quantityChange < 0) return 'trending_down';
    return 'remove';
  }

  isReasonPurchase(): boolean {
    return this.adjustmentForm.get('reason')?.value === 'PURCHASE';
  }

  submit() {
    if (this.adjustmentForm.invalid) {
      this.showError('Please fill all required fields');
      return;
    }

    if (this.quantityChange === 0) {
      this.showError('No quantity change detected');
      return;
    }

    // Stock alert warnings
    const currentQty = this.item.total_quantity || 0;
    const newQty = this.adjustmentForm.get('newQuantity')?.value;
    const changePercent = currentQty > 0 ? Math.abs((this.quantityChange / currentQty) * 100) : 100;
    
    // Build comprehensive warning message
    let warningMessage = '';
    
    // Out of stock warning (highest priority)
    if (this.willBeOutOfStock) {
      warningMessage = `🚨 CRITICAL WARNING: OUT OF STOCK!\n\n`;
      warningMessage += `This adjustment will cause the item to be OUT OF STOCK!\n\n`;
      warningMessage += `Current Stock: ${currentQty} units\n`;
      warningMessage += `After Adjustment: ${newQty} units\n`;
      warningMessage += `Minimum Required: ${this.minStock} units\n\n`;
      warningMessage += `⚠️ This will trigger stock alerts and may affect sales!\n\n`;
      warningMessage += `Are you absolutely sure you want to proceed?`;
      
      if (!confirm(warningMessage)) {
        return;
      }
    }
    // Low stock warning
    else if (this.willBeLowStock) {
      warningMessage = `⚠️ LOW STOCK WARNING\n\n`;
      warningMessage += `This adjustment will cause LOW STOCK status!\n\n`;
      warningMessage += `After Adjustment: ${newQty} units\n`;
      warningMessage += `Minimum Required: ${this.minStock} units\n`;
      warningMessage += `Remaining Buffer: ${newQty - this.minStock} units\n\n`;
      warningMessage += `This will trigger low stock notifications.\n\n`;
      warningMessage += `Proceed anyway?`;
      
      if (!confirm(warningMessage)) {
        return;
      }
    }
    // Large adjustment warning
    else if (changePercent > 20) {
      warningMessage = `⚠️ Large Adjustment Warning\n\n`;
      warningMessage += `You are changing the quantity by ${changePercent.toFixed(1)}%.\n\n`;
      warningMessage += `Current: ${currentQty} units\n`;
      warningMessage += `New: ${newQty} units\n`;
      warningMessage += `Change: ${this.quantityChange > 0 ? '+' : ''}${this.quantityChange} units\n\n`;
      
      if (this.statusWillChange) {
        warningMessage += `Status Change: ${this.item.status?.replace('_', ' ')} → ${this.predictedStatus.replace('_', ' ')}\n\n`;
      }
      
      warningMessage += `Are you sure?`;
      
      if (!confirm(warningMessage)) {
        return;
      }
    }
    // Status change info (non-blocking)
    else if (this.statusWillChange) {
      const proceed = confirm(`ℹ️ Status Change Notice\n\n` +
        `Status will change: ${this.item.status?.replace('_', ' ')} → ${this.predictedStatus.replace('_', ' ')}\n\n` +
        `Proceed with adjustment?`);
      
      if (!proceed) {
        return;
      }
    }

    this.loading = true;
    const adjustmentData = this.adjustmentForm.value;

    this.crudService.adjustItemStock(this.item.id, adjustmentData).subscribe({
      next: (response: any) => {
        this.showSuccess('Stock adjusted successfully');
        this.dialogRef.close({ success: true, updatedItem: response.data });
      },
      error: (error) => {
        console.error('Error adjusting stock:', error);
        this.showError(error.error?.errorDescription || 'Failed to adjust stock');
        this.loading = false;
      }
    });
  }

  cancel() {
    this.dialogRef.close({ success: false });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}

