import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StockAlert } from '../../../shared/services/stock-alert.service';

@Component({
  selector: 'app-alert-details-dialog',
  templateUrl: './alert-details-dialog.component.html',
  styleUrls: ['./alert-details-dialog.component.scss'],
  standalone: false
})
export class AlertDetailsDialogComponent {
  alert: StockAlert;

  constructor(
    public dialogRef: MatDialogRef<AlertDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { alert: StockAlert }
  ) {
    this.alert = data.alert;
  }

  onClose() {
    this.dialogRef.close();
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'OUT_OF_STOCK': return 'text-red-600 bg-red-100';
      case 'LOW_STOCK': return 'text-yellow-600 bg-yellow-100';
      case 'REORDER_REQUIRED': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
