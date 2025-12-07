import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EnhancedItemsService, EnhancedItem, ItemStatus } from '../../enhanced-items.service';

@Component({
  selector: 'app-bulk-operations-dialog',
  templateUrl: './bulk-operations-dialog.component.html',
  styleUrls: ['./bulk-operations-dialog.component.scss'],
  standalone: false
})
export class BulkOperationsDialogComponent {
  bulkForm: FormGroup;
  loading = false;
  selectedItems: EnhancedItem[];

  operationTypes = [
    { value: 'update_status', label: 'Update Status' },
    { value: 'update_category', label: 'Update Category' },
    { value: 'update_supplier', label: 'Update Supplier' },
    { value: 'adjust_pricing', label: 'Adjust Pricing' },
    { value: 'update_tags', label: 'Update Tags' },
    { value: 'export_selected', label: 'Export Selected' },
    { value: 'delete_items', label: 'Delete Items' }
  ];

  statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'DISCONTINUED', label: 'Discontinued' },
    { value: 'DRAFT', label: 'Draft' }
  ];

  constructor(
    public dialogRef: MatDialogRef<BulkOperationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { items: EnhancedItem[] },
    private fb: FormBuilder,
    private enhancedItemsService: EnhancedItemsService
  ) {
    this.selectedItems = data.items;
    this.initializeForm();
  }

  private initializeForm() {
    this.bulkForm = this.fb.group({
      operation: ['', Validators.required],
      status: [''],
      category: [''],
      supplier: [''],
      priceAdjustment: [''],
      priceAdjustmentType: ['percentage'],
      priceAdjustmentValue: [0],
      tags: [''],
      confirmDelete: [false]
    });
  }

  onOperationChange() {
    const operation = this.bulkForm.get('operation')?.value;
    
    // Reset all fields
    this.bulkForm.patchValue({
      status: '',
      category: '',
      supplier: '',
      priceAdjustment: '',
      priceAdjustmentType: 'percentage',
      priceAdjustmentValue: 0,
      tags: '',
      confirmDelete: false
    });
  }

  onSubmit() {
    if (this.bulkForm.valid) {
      this.loading = true;
      const formValue = this.bulkForm.value;
      const operation = formValue.operation;
      
      switch (operation) {
        case 'update_status':
          this.updateStatus(formValue.status);
          break;
        case 'update_category':
          this.updateCategory(formValue.category);
          break;
        case 'update_supplier':
          this.updateSupplier(formValue.supplier);
          break;
        case 'adjust_pricing':
          this.adjustPricing(formValue.priceAdjustmentType, formValue.priceAdjustmentValue);
          break;
        case 'update_tags':
          this.updateTags(formValue.tags);
          break;
        case 'export_selected':
          this.exportSelected();
          break;
        case 'delete_items':
          this.deleteItems();
          break;
      }
    }
  }

  private updateStatus(status: ItemStatus) {
    const updates = this.selectedItems.map(item => ({
      id: item.id,
      updates: { status }
    }));
    
    this.enhancedItemsService.bulkUpdateItems(updates).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close({ success: true, message: `Status updated for ${this.selectedItems.length} items` });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating status:', error);
      }
    });
  }

  private updateCategory(categoryId: string) {
    // Get categories from service
    this.enhancedItemsService.getCategories().subscribe(categories => {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) {
        console.error('Category not found:', categoryId);
        return;
      }

      const updates = this.selectedItems.map(item => ({
        id: item.id,
        updates: { category: category }
      }));
      
      this.enhancedItemsService.bulkUpdateItems(updates).subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close({ success: true, message: `Category updated for ${this.selectedItems.length} items` });
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.loading = false;
        }
      });
    });
  }

  private updateSupplier(supplier: string) {
    const updates = this.selectedItems.map(item => ({
      id: item.id,
      updates: { primarySupplier: supplier }
    }));
    
    this.enhancedItemsService.bulkUpdateItems(updates).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close({ success: true, message: `Supplier updated for ${this.selectedItems.length} items` });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating supplier:', error);
      }
    });
  }

  private adjustPricing(type: string, value: number) {
    const updates = this.selectedItems.map(item => {
      let newPrice = item.basePrice;
      
      if (type === 'percentage') {
        newPrice = item.basePrice * (1 + value / 100);
      } else if (type === 'fixed') {
        newPrice = item.basePrice + value;
      }
      
      return {
        id: item.id,
        updates: { basePrice: Math.max(0, newPrice) }
      };
    });
    
    this.enhancedItemsService.bulkUpdateItems(updates).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close({ success: true, message: `Pricing adjusted for ${this.selectedItems.length} items` });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error adjusting pricing:', error);
      }
    });
  }

  private updateTags(tags: string) {
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const updates = this.selectedItems.map(item => ({
      id: item.id,
      updates: { tags: [...item.tags, ...tagArray] }
    }));
    
    this.enhancedItemsService.bulkUpdateItems(updates).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close({ success: true, message: `Tags updated for ${this.selectedItems.length} items` });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating tags:', error);
      }
    });
  }

  private exportSelected() {
    const csvContent = this.generateCSV(this.selectedItems);
    this.downloadCSV(csvContent, 'selected-items-export.csv');
    this.loading = false;
    this.dialogRef.close({ success: true, message: `Exported ${this.selectedItems.length} items` });
  }

  private deleteItems() {
    if (!this.bulkForm.get('confirmDelete')?.value) {
      alert('Please confirm deletion by checking the confirmation box');
      return;
    }
    
    const deletePromises = this.selectedItems.map(item => 
      this.enhancedItemsService.deleteItem(item.id).toPromise()
    );
    
    Promise.all(deletePromises).then(() => {
      this.loading = false;
      this.dialogRef.close({ success: true, message: `Deleted ${this.selectedItems.length} items` });
    }).catch(error => {
      this.loading = false;
      console.error('Error deleting items:', error);
    });
  }

  private generateCSV(items: EnhancedItem[]): string {
    const headers = [
      'Name', 'Code', 'SKU', 'Category', 'Quantity', 'Price', 'Cost', 'Status', 'Supplier'
    ];
    
    const rows = items.map(item => [
      item.name,
      item.code,
      item.sku,
      item.category.name,
      item.quantity,
      item.basePrice,
      item.cost,
      item.status,
      item.primarySupplier
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  onCancel() {
    this.dialogRef.close();
  }

  getSelectedItemsSummary(): string {
    return `${this.selectedItems.length} items selected`;
  }

  getSelectedItemsNames(): string[] {
    return this.selectedItems.map(item => item.name);
  }
}
