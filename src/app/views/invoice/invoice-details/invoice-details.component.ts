import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UntypedFormGroup, UntypedFormArray, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../invoice.service';
import { Invoice, InvoiceItem } from 'app/shared/models/invoice.model';
import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CrudService } from 'app/views/cruds/crud.service';

@Component({
    selector: 'app-invoice-details',
    templateUrl: './invoice-details.component.html',
    styleUrls: ['./invoice-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class InvoiceDetailsComponent implements OnInit, OnDestroy {
  cost = 0;
  vat = 0;
  discounts = 0;
  currency = '$';
  showEditOption = false;
  isLoading = false;
  invoiceForm: UntypedFormGroup;
  invoiceFormSub: Subscription;
  invocieId: number;
  invoice: Invoice = {
    item: []
  };
  
  // Store original item quantities for validation (Rule 3.1)
  originalItemQuantities: Map<string, number> = new Map();
  
  // Store original item prices for validation (Rule 7.2)
  originalItemPrices: Map<string, number> = new Map();

  emptyFormObject: InvoiceItem = {
    name: '',
    price: null,
    unit: null,
    code: '',
    isFree: false
  };

  itemTableColumn: string[] = [
    'Number',
    'Item Name',
    'Unit Price',
    'Unit',
    'Is Free',
    'Cost'
  ];

  // Client search properties
  public clientSearchTerm: string = '';
  public filteredClients: any[] = [];
  public selectedClient: any = null;
  public allClients: any[] = [];

  // Item search properties
  public allItems: any[] = [];
  public itemSearchResults: any[] = [];

  // Modal properties
  public showItemSelectionModal: boolean = false;
  public modalSearchTerm: string = '';
  public filteredModalItems: any[] = [];
  public currentItemIndex: number = -1;
  
  // Server-side search properties
  private searchSubject = new Subject<string>();
  public isLoadingItems: boolean = false;
  public currentPage: number = 0;
  public pageSize: number = 20;
  public totalItems: number = 0;
  public hasMoreItems: boolean = true;
  private deductFromStockSub: Subscription | null = null;

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private crudService: CrudService,
    private snackBar: MatSnackBar,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.invocieId = this.route.snapshot.params['id'];
    if (this.invocieId) {
      this.getInvoice();
      this.showEditOption = false;
    } else {
      this.buildInvoiceForm();
      this.showEditOption = true;
    }

    // Load clients for search functionality
    this.loadClients();
    
    // Set up debounced search for items
    this.setupItemSearch();

    // Add class for print media check _invoice.scss
    this.document.body.classList.add('print-body-content');
  }
  
  ngOnDestroy() {
    this.document.body.classList.remove('print-body-content');
    this.searchSubject.complete();
    if (this.deductFromStockSub) {
      this.deductFromStockSub.unsubscribe();
    }
  }

  getInvoice() {
    this.invoiceService.getInvoiceById(this.invocieId).subscribe((invoice: Invoice) => {
      this.invoice = invoice;
      this.buildInvoiceForm(this.invoice);
      this.calculateCost(this.invoice);
      
      // Set selected client if invoice has clientId and clientName
      if (invoice.clientId && invoice.clientName) {
        this.selectedClient = {
          id: invoice.clientId,
          name: invoice.clientName
        };
      }
      
      // Load stock data for all items in the invoice (for validation)
      if (invoice.item && invoice.item.length > 0) {
        invoice.item.forEach(invoiceItem => {
          if (invoiceItem.itemId) {
            // Fetch item details to get current stock levels
            this.crudService.getItemsWithPagination({
              search: invoiceItem.code || '',
              page: 0,
              pageSize: 1,
              sortBy: 'Descending'
            }).subscribe({
              next: (response: any) => {
                if (response.data && response.data.length > 0) {
                  const itemWithStock = response.data[0];
                  // Add to filteredModalItems for stock validation
                  if (!this.filteredModalItems.find(i => i.id === itemWithStock.id)) {
                    this.filteredModalItems.push(itemWithStock);
                  }
                }
              },
              error: (err) => console.error('Error loading item stock data:', err)
            });
          }
        });
      }
      
      // Lock form if invoice is PAID (Rule #1: Lock PAID Invoices)
      if (invoice.status === 'PAID') {
        this.invoiceForm.disable();
        this.showEditOption = false; // Force view mode
      }
      
      this.cdr.markForCheck();
    });
  }

  buildInvoiceForm(invoice?: Invoice) {
    this.invoiceForm = this.fb.group({
      id: [invoice ? invoice.id : ''],
      orderNo: [invoice ? (invoice.invoiceNumber || invoice.orderNo) : ''],
      status: invoice ? invoice.status : 'PENDING',
      date: invoice ? new Date(invoice.invoiceDate || invoice.date) : new Date(),
      vat: invoice ? invoice.vat : 0,
      discounts: [invoice ? (invoice.discountAmount || invoice.discounts || 0) : 0],
      deductFromStock: [invoice ? invoice.deductFromStock : 'Y'],
      paymentMethod: [invoice ? invoice.paymentMethod : 'cash'], // Payment method
      clientId: [invoice ? invoice.clientId : null, Validators.required],
      initialPayment: [invoice ? (invoice.amountSettled || invoice.initialPayment || 0) : 0],
      item: this.fb.array([])
    });

    this.invoice.item.forEach(i => {
      this.addNewItem(i);
    });

    if (this.invoiceFormSub){
      this.invoiceFormSub.unsubscribe();
    }

    this.invoiceFormSub = this.invoiceForm.valueChanges.subscribe(res => {
      this.calculateCost(res);
    });

    if (this.deductFromStockSub) {
      this.deductFromStockSub.unsubscribe();
    }
    const deductFromStockControl = this.invoiceForm.get('deductFromStock');
    if (deductFromStockControl) {
      this.deductFromStockSub = deductFromStockControl.valueChanges.subscribe(() => {
        this.revalidateAllQuantities();
      });
    }

    this.revalidateAllQuantities();

  }

  calculateCost(invoice: Invoice) {
    this.cost = 0;
    invoice.item.forEach(element => {
      if (!element.isFree) {
        this.cost += element.unit * element.price;
      }
    });
    this.vat = invoice.vat || 0;
    this.discounts = invoice.discountAmount || invoice.discounts || 0;
  }

  calculateSubtotal(): number {
    let subtotal = 0;
    this.invoiceItemFormArray.controls.forEach(item => {
      subtotal += this.calculateItemTotal(item);
    });
    return subtotal;
  }

  addNewItem(item: InvoiceItem) {
    const newItemGroup = this.fb.group({
      itemId: [item ? item.itemId : null],  // Add itemId for backend
      name: [item ? item.name : ''],
      price: [item ? item.price : ''],
      unit: [item ? item.unit : ''],
      code: [item ? item.code : ''],
      isFree: [item ? item.isFree : false]
    });
    
    this.invoiceItemFormArray.push(newItemGroup);
    
    // Store original quantity and price if editing (Rule 3.1 & 7.2)
    if (this.invocieId && item && item.itemId) {
      if (item.unit) {
        this.originalItemQuantities.set(item.itemId, item.unit);
      }
      if (item.price) {
        this.originalItemPrices.set(item.itemId, item.price);
      }
    }
    
    // Initialize search results array for this item
    this.itemSearchResults.push([]);
  }

  deleteItemFromInvoice(i: number) {
    this.invoiceItemFormArray.removeAt(i);
    // Remove corresponding search results
    this.itemSearchResults.splice(i, 1);
  }

  async saveInvoice() {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.invoiceForm.get('clientId')?.markAsTouched();
      return;
    }
    
    // Check if invoice has any items
    if (this.invoiceItemFormArray.length === 0) {
      return;
    }
    
    // Rule #4: Prevent Over-Payment
    const totalAfterDiscount = this.calculateSubtotal() - this.discounts;
    const initialPayment = this.invoiceForm.get('initialPayment')?.value || 0;
    
    if (initialPayment > totalAfterDiscount) {
      alert(`Initial payment ($${initialPayment}) cannot exceed invoice total ($${totalAfterDiscount.toFixed(2)})`);
      return;
    }
    
    // Rule #5: Minimum Payment Rules
    const status = this.invoiceForm.get('status')?.value;
    if (status === 'DEPT' && initialPayment <= 0) {
      alert('DEPT status requires an initial payment greater than $0');
      return;
    }
    
    if (status === 'PAID' && initialPayment < totalAfterDiscount) {
      alert(`PAID status requires full payment. Expected: $${totalAfterDiscount.toFixed(2)}, Got: $${initialPayment}`);
      return;
    }
    
    // Rule 7.2: Price Change Warning (when editing)
    if (this.invocieId) {
      const priceChanges: string[] = [];
      
      this.invoiceItemFormArray.controls.forEach((itemControl: any) => {
        const itemId = itemControl.get('itemId')?.value;
        const newPrice = itemControl.get('price')?.value || 0;
        const itemName = itemControl.get('name')?.value;
        
        if (itemId && this.originalItemPrices.has(itemId)) {
          const originalPrice = this.originalItemPrices.get(itemId) || 0;
          if (newPrice !== originalPrice) {
            priceChanges.push(`${itemName}: $${originalPrice.toFixed(2)} → $${newPrice.toFixed(2)}`);
          }
        }
      });
      
      if (priceChanges.length > 0) {
        const confirmChange = confirm(`⚠️ Price Changed:\n\n${priceChanges.join('\n')}\n\nPrice changes may affect agreements with the client.\nDo you want to proceed?`);
        if (!confirmChange) {
          return; // User cancelled
        }
      }
    }
    
    // Rule 3.1: Quantity Decrease Only in Edit
    if (this.invocieId) {
      const increasedItems: string[] = [];
      
      this.invoiceItemFormArray.controls.forEach((itemControl: any) => {
        const itemId = itemControl.get('itemId')?.value;
        const newQuantity = itemControl.get('unit')?.value || 0;
        const itemName = itemControl.get('name')?.value;
        
        if (itemId && this.originalItemQuantities.has(itemId)) {
          const originalQuantity = this.originalItemQuantities.get(itemId) || 0;
          if (newQuantity > originalQuantity) {
            increasedItems.push(`${itemName}: ${originalQuantity} → ${newQuantity} units`);
          }
        }
      });
      
      if (increasedItems.length > 0) {
        alert(`Cannot increase item quantities when editing an invoice.\n\nIncreased items:\n${increasedItems.join('\n')}\n\nTo add more items, please create a new invoice.`);
        return;
      }
    }
    
    // Rule 9.2: Minimum Invoice Amount
    const minimumAmount = 10;
    if (totalAfterDiscount < minimumAmount) {
      alert(`Invoice total ($${totalAfterDiscount.toFixed(2)}) must be at least $${minimumAmount}.00`);
      return;
    }
    
    // Rule 3.3: Low Stock Warning Before Invoice (only if deducting stock)
    if (this.invoiceForm.get('deductFromStock')?.value === 'Y') {
      const canProceed = await this.checkStockWarnings();
      if (!canProceed) {
        return; // User cancelled
      }
    }
    
    this.isLoading = true;
    const payload = this.prepareSavePayload();

    this.invoiceService.saveInvoice(payload)
      .subscribe({
        next: (res: Invoice) => {
          this.invoice = this.invoiceForm.value;
          this.isLoading = false;
          this.showEditOption = false;

          this.cdr.markForCheck();

          // Navigate back to invoice list instead of trying to view the new invoice
          // (backend doesn't return the invoice ID in the response)
          this.router.navigateByUrl('/invoice/invoices');
        },
        error: (error) => {
          this.isLoading = false;
          const message = this.getSaveErrorMessage(error, payload);
          this.snackBar.open(message, 'Close', {
            duration: 6000,
            panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
        }
      });
  }
  
  // Rule 3.3: Check for stock availability and low stock warnings
  async checkStockWarnings(): Promise<boolean> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // We need to fetch fresh stock data to ensure accuracy
    const itemIds = this.invoiceItemFormArray.controls
      .map(control => control.get('itemId')?.value)
      .filter(id => id);
    
    if (itemIds.length === 0) {
      return true; // No items with IDs, proceed
    }
    
    // Get fresh stock data for all items in the invoice
    try {
      // Fetch stock for each item
      for (let i = 0; i < this.invoiceItemFormArray.length; i++) {
        const itemControl = this.invoiceItemFormArray.at(i);
        const itemId = itemControl.get('itemId')?.value;
        const quantity = itemControl.get('unit')?.value || 0;
        const itemName = itemControl.get('name')?.value;
        const itemCode = itemControl.get('code')?.value;
        const isFree = itemControl.get('isFree')?.value;
        
        if (itemId && quantity > 0 && !isFree) {
          // Try to find item in filteredModalItems first (from recent search)
          let item = this.filteredModalItems.find(i => i.id === itemId);
          
          // If not found, we need to fetch it or use available data
          if (item) {
            const currentStock = item.total_quantity || 0;
            const minStock = item.min_stock || 0;
            
            // CRITICAL: Check if stock is insufficient (BLOCKING ERROR)
            if (quantity > currentStock) {
              errors.push(`${itemName} (${itemCode}): Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
            } else {
              // Stock is sufficient, but check for low stock warning
              const stockAfter = currentStock - quantity;
              
              if (stockAfter === 0) {
                warnings.push(`${itemName}: Will be OUT OF STOCK (0 remaining)`);
              } else if (stockAfter <= minStock) {
                warnings.push(`${itemName}: Will be LOW STOCK (${stockAfter} remaining, min: ${minStock})`);
              }
            }
          } else {
            // Item not in cache - show warning that we can't validate
            warnings.push(`${itemName}: Unable to verify stock (item not in cache). Please ensure sufficient stock.`);
          }
        }
      }
      
      // If there are critical errors (insufficient stock), block the save
      if (errors.length > 0) {
        alert(`❌ Cannot create invoice - Insufficient Stock:\n\n${errors.join('\n')}\n\nPlease reduce quantities or select different items.`);
        return false;
      }
      
      // If there are warnings (low stock), ask user to confirm
      if (warnings.length > 0) {
        const message = `⚠️ Warning: This invoice will cause:\n\n${warnings.join('\n')}\n\nDo you want to proceed?`;
        return confirm(message);
      }
      
      return true; // No errors or warnings, proceed
      
    } catch (error) {
      console.error('Error checking stock:', error);
      // If we can't check stock, ask user to proceed with caution
      return confirm('⚠️ Unable to verify stock levels. Do you want to proceed anyway?');
    }
  }

  print() {
    window.print();
  }

  get invoiceItemFormArray(): UntypedFormArray {
    return this.invoiceForm.get('item') as UntypedFormArray;
  }

  get canSaveInvoice(): boolean {
    return this.invoiceForm.valid && this.invoiceItemFormArray.length > 0;
  }

  getStatusColor(status: string): string {
    switch(status?.toUpperCase()) {
      case 'PENDING': return 'warn';
      case 'DEPT': return 'warn';
      case 'PAID': return 'accent';
      default: return 'primary';
    }
  }

  // Rule #2: Get available status transitions based on current status
  getAvailableStatuses(): string[] {
    const currentStatus = this.invoice?.status?.toUpperCase();
    
    // If creating new invoice, all statuses available
    if (!this.invocieId) {
      return ['PENDING', 'DEPT', 'PAID'];
    }
    
    // Status can only move forward, not backward
    switch(currentStatus) {
      case 'PENDING':
        return ['PENDING', 'DEPT', 'PAID']; // Can move to DEPT or PAID
      case 'DEPT':
        return ['DEPT', 'PAID']; // Can only move to PAID
      case 'PAID':
        return ['PAID']; // Cannot change from PAID
      default:
        return ['PENDING', 'DEPT', 'PAID'];
    }
  }

  // Check if a status option should be disabled
  isStatusDisabled(status: string): boolean {
    return !this.getAvailableStatuses().includes(status);
  }

  // Client search methods
  loadClients() {
    this.crudService.getAllClients().subscribe(
      (clients: any[]) => {
        this.allClients = clients;
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error loading clients:', error);
        this.allClients = [];
        this.cdr.markForCheck();
      }
    );
  }

  // Item search methods - Setup debounced search
  setupItemSearch() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performItemSearch(searchTerm, 0); // Reset to page 0 on new search
    });
  }

  performItemSearch(searchTerm: string, page: number = 0) {
    this.isLoadingItems = true;
    this.currentPage = page;
    
    const params = {
      search: searchTerm.trim(),
      page: page,
      pageSize: this.pageSize,
      sortBy: 'Ascending'
    };

    this.crudService.getItemsWithPagination(params).subscribe(
      (response: any) => {
        if (page === 0) {
          // New search - replace items
          this.filteredModalItems = response.data || [];
        } else {
          // Load more - append items
          this.filteredModalItems = [...this.filteredModalItems, ...(response.data || [])];
        }
        
        this.totalItems = response.totalElements || 0;
        this.hasMoreItems = (page + 1) < (response.totalPages || 0);
        this.isLoadingItems = false;
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error loading items:', error);
        this.filteredModalItems = page === 0 ? [] : this.filteredModalItems;
        this.isLoadingItems = false;
        this.hasMoreItems = false;
        this.cdr.markForCheck();
      }
    );
  }

  searchClients(searchTerm: string) {
    this.clientSearchTerm = searchTerm;
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      this.filteredClients = [];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredClients = this.allClients.filter(client => 
      client.name.toLowerCase().includes(term)
    );
  }

  onClientSelected(client: any) {
    this.selectedClient = client;
    // Update form with client ID
    if (client && client.id) {
      this.invoiceForm.patchValue({
        clientId: client.id
      });
      const control = this.invoiceForm.get('clientId');
      control?.markAsDirty();
      control?.markAsTouched();
      control?.updateValueAndValidity();
    }
  }

  searchItems(event: any, itemIndex: number) {
    const searchTerm = event.target.value;
    
    if (!searchTerm || searchTerm.trim().length < 1) {
      this.itemSearchResults[itemIndex] = [];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.itemSearchResults[itemIndex] = this.allItems.filter(item => 
      item.code && item.code.toLowerCase().includes(term) ||
      item.name && item.name.toLowerCase().includes(term)
    ).slice(0, 5); // Limit to 5 results
  }

  selectItem(item: any, itemIndex: number) {
    // Update the form with selected item data
    const itemFormGroup = this.invoiceItemFormArray.at(itemIndex);
    itemFormGroup.patchValue({
      itemId: item.id || item.itemId || null,
      name: item.name,
      code: item.code,
      price: item.final_price
    });
    
    if (item && item.id && !this.filteredModalItems.find(i => i.id === item.id)) {
      this.filteredModalItems.push(item);
    }

    // Clear search results
    this.itemSearchResults[itemIndex] = [];

    this.onQuantityChange(itemIndex);
  }

  trackByClientId(index: number, client: any): any {
    return client.id || index;
  }

  calculateItemTotal(item: any): number {
    const unit = item.get('unit')?.value || 0;
    const price = item.get('price')?.value || 0;
    const isFree = item.get('isFree')?.value || false;
    
    if (isFree) {
      return 0;
    }
    
    return unit * price;
  }

  getFreeItemsValue(): number {
    // Calculate the value of free items from backend data
    if (this.invoice?.totalAmountBeforeDiscount && this.invoice?.totalAmount !== undefined) {
      const discount = this.invoice?.discountAmount || this.invoice?.discounts || 0;
      const freeItemsValue = this.invoice.totalAmountBeforeDiscount - this.invoice.totalAmount - discount;
      return freeItemsValue > 0 ? freeItemsValue : 0;
    }
    return 0;
  }

  navigateToInvoices(): void {
    this.router.navigate(['/invoice/invoices']);
  }

  clearSelectedClient(): void {
    this.selectedClient = null;
    this.clientSearchTerm = '';
    const control = this.invoiceForm.get('clientId');
    if (control) {
      control.setValue(null);
      control.markAsTouched();
      control.markAsDirty();
      control.updateValueAndValidity();
    }
  }

  setMaxInitialPayment(): void {
    const maxPayment = this.getMaxInitialPayment();
    const control = this.invoiceForm.get('initialPayment');
    if (control) {
      control.setValue(maxPayment);
      control.markAsDirty();
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  getMaxInitialPayment(): number {
    const subtotal = this.calculateSubtotal();
    const totalAfterDiscount = subtotal - (this.discounts || 0);
    return Math.max(Number(totalAfterDiscount.toFixed(2)), 0);
  }

  // Modal methods
  openItemSelectionModal(itemIndex: number): void {
    this.currentItemIndex = itemIndex;
    this.modalSearchTerm = '';
    this.filteredModalItems = [];
    this.currentPage = 0;
    this.hasMoreItems = true;
    this.showItemSelectionModal = true;
    
    // Load initial items with empty search
    this.performItemSearch('', 0);
  }

  closeItemSelectionModal(): void {
    this.showItemSelectionModal = false;
    this.modalSearchTerm = '';
    this.filteredModalItems = [];
    this.currentItemIndex = -1;
    this.currentPage = 0;
  }

  searchItemsInModal(searchTerm: string): void {
    this.modalSearchTerm = searchTerm;
    this.searchSubject.next(searchTerm);
  }
  
  loadMoreItems(): void {
    if (!this.isLoadingItems && this.hasMoreItems) {
      this.performItemSearch(this.modalSearchTerm, this.currentPage + 1);
    }
  }

  selectItemFromModal(item: any): void {
    if (this.currentItemIndex >= 0) {
      // Update the form with selected item data
      const itemFormGroup = this.invoiceItemFormArray.at(this.currentItemIndex);
      itemFormGroup.patchValue({
        itemId: item.id,  // Add item ID for backend
        name: item.name,
        code: item.code,
        price: item.final_price
      });
      
      // Keep the full item in filteredModalItems if not already there (for stock validation)
      if (!this.filteredModalItems.find(i => i.id === item.id)) {
        this.filteredModalItems.push(item);
      }

      this.onQuantityChange(this.currentItemIndex);
    }
    
    this.closeItemSelectionModal();
  }

  trackByItemId(index: number, item: any): any {
    return item.id || item.code || index;
  }

  // Check if item is available for selection
  isItemAvailable(item: any): boolean {
    // If deductFromStock is 'N', all items are available
    const deductFromStock = this.invoiceForm.get('deductFromStock')?.value;
    if (deductFromStock === 'N') {
      return true;
    }
    
    // If deductFromStock is 'Y', check stock availability
    const totalQuantity = item.total_quantity || 0;
    return totalQuantity > 0;
  }

  private prepareSavePayload(): any {
    const formValue = this.invoiceForm.value || {};
    const items = this.invoiceItemFormArray.controls.map((control: UntypedFormGroup) => ({
      itemId: control.get('itemId')?.value,
      quantity: this.toNumber(control.get('unit')?.value) || 0,
      unitPrice: this.toNumber(control.get('price')?.value) || 0,
      isFree: !!control.get('isFree')?.value
    }));

    return {
      ...formValue,
      item: this.invoiceItemFormArray.value,
      items,
      discountAmount: formValue.discounts ?? formValue.discountAmount ?? 0,
      vatPercentage: formValue.vat ?? formValue.vatPercentage ?? 0,
      invoiceDate: formValue.date ?? formValue.invoiceDate ?? new Date().toISOString()
    };
  }

  getQuantityMax(index: number): number | null {
    const deductFromStock = this.invoiceForm.get('deductFromStock')?.value;
    if (deductFromStock !== 'Y') {
      return null;
    }
    const itemControl = this.invoiceItemFormArray.at(index) as UntypedFormGroup;
    if (!itemControl) {
      return null;
    }
    return this.getAvailableStockForItemControl(itemControl);
  }

  onQuantityChange(index: number): void {
    const itemControl = this.invoiceItemFormArray.at(index) as UntypedFormGroup;
    if (!itemControl) {
      return;
    }
    const quantityControl = itemControl.get('unit');
    if (!quantityControl) {
      return;
    }
    const deductFromStock = this.invoiceForm.get('deductFromStock')?.value;
    if (deductFromStock !== 'Y') {
      this.clearControlError(quantityControl, 'exceedsStock');
      return;
    }
    const availableStock = this.getAvailableStockForItemControl(itemControl);
    if (availableStock === null) {
      this.clearControlError(quantityControl, 'exceedsStock');
      return;
    }

    const quantity = this.toNumber(quantityControl.value);
    if (quantity !== null && quantity > availableStock) {
      const errors = { ...(quantityControl.errors || {}) };
      errors['exceedsStock'] = { available: availableStock };
      quantityControl.setErrors(errors);
      quantityControl.markAsTouched();
    } else {
      this.clearControlError(quantityControl, 'exceedsStock');
    }
  }

  private revalidateAllQuantities(): void {
    for (let i = 0; i < this.invoiceItemFormArray.length; i++) {
      this.onQuantityChange(i);
    }
  }

  private getAvailableStockForItemControl(itemControl: UntypedFormGroup): number | null {
    if (!itemControl) {
      return null;
    }
    const itemId = itemControl.get('itemId')?.value;
    const itemCode = itemControl.get('code')?.value;
    const sources = [
      ...(this.filteredModalItems || []),
      ...(this.allItems || [])
    ];

    let matchedItem: any = null;
    if (itemId) {
      matchedItem = sources.find(item => item && (item.id === itemId || item.itemId === itemId));
    }

    if (!matchedItem && itemCode) {
      matchedItem = sources.find(item => item && item.code === itemCode);
    }

    if (!matchedItem) {
      return null;
    }

    const stockCandidates = [
      matchedItem.total_quantity,
      matchedItem.totalQuantity,
      matchedItem.currentStock,
      matchedItem.current_stock,
      matchedItem.availableQuantity,
      matchedItem.available_quantity
    ];

    for (const candidate of stockCandidates) {
      const normalized = this.toNumber(candidate);
      if (normalized !== null) {
        return normalized;
      }
    }

    return null;
  }

  private clearControlError(control: any, errorKey: string): void {
    if (!control) {
      return;
    }
    const errors = control.errors;
    if (!errors || !errors[errorKey]) {
      return;
    }
    const { [errorKey]: _removed, ...remaining } = errors;
    control.setErrors(Object.keys(remaining).length ? remaining : null);
  }

  private toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const normalized = Number(value);
    return Number.isNaN(normalized) ? null : normalized;
  }

  private getSaveErrorMessage(error: any, payload: any): string {
    const httpError = error instanceof HttpErrorResponse ? error : null;
    let backendError: any = httpError ? httpError.error : (error?.error ?? error);

    if (typeof backendError === 'string') {
      const parsed = this.tryParseJson(backendError);
      backendError = parsed ?? backendError;
    }

    const messageCandidates = [
      backendError?.errorDescription,
      backendError?.message,
      backendError?.errorMessage,
      typeof backendError === 'string' ? backendError : null,
      error?.message
    ];

    for (const candidate of messageCandidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        const normalized = candidate.trim();
        const lowered = normalized.toLowerCase();
        if (lowered === 'unexpected error occurred.' || lowered.startsWith('http failure response')) {
          continue;
        }
        return normalized;
      }
    }

    const stockMessage = this.getLocalStockValidationMessage();
    if (stockMessage) {
      return stockMessage;
    }

    if (httpError?.status === 500) {
      return 'Server error while saving invoice. Please review item quantities or try again later.';
    }

    if (payload?.items?.length) {
      return 'Unable to create invoice due to stock validation. Please review item quantities.';
    }

    return 'Failed to save invoice. Please try again.';
  }

  private getLocalStockValidationMessage(): string | null {
    if (this.invoiceForm.get('deductFromStock')?.value !== 'Y') {
      return null;
    }

    for (let i = 0; i < this.invoiceItemFormArray.length; i++) {
      const control = this.invoiceItemFormArray.at(i) as UntypedFormGroup;
      const quantity = this.toNumber(control.get('unit')?.value);
      const available = this.getAvailableStockForItemControl(control);
      if (quantity !== null && available !== null && quantity > available) {
        const label = control.get('name')?.value || control.get('code')?.value || control.get('itemId')?.value || 'Selected item';
        return `Unable to save invoice: "${label}" exceeds available stock (requested ${quantity}, available ${available}).`;
      }
      if (available === null && quantity !== null) {
        const label = control.get('name')?.value || control.get('code')?.value || control.get('itemId')?.value || 'Selected item';
        return `Unable to verify stock for "${label}". Please ensure the quantity ${quantity} is within available inventory.`;
      }
    }

    return null;
  }

  private tryParseJson(value: string): any | null {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
