import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { SettlementService } from '../settlement.service';
import { InvoiceService } from '../invoice.service';
import { SettlementReceiptService } from '../settlement-receipt.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-settlements',
  templateUrl: './settlements.component.html',
  styleUrls: ['./settlements.component.scss'],
  standalone: false
})
export class SettlementsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  
  dataSource: MatTableDataSource<any>;
  settlements: any[] = [];
  loading: boolean = false;
  showAddForm: boolean = false;
  
  // Settlement form
  settlementForm: UntypedFormGroup;
  availableInvoices: any[] = [];
  selectedInvoice: any = null;
  
  // Invoice search modal
  showInvoiceModal: boolean = false;
  invoiceSearchTerm: string = '';
  filteredInvoices: any[] = [];
  isLoadingInvoices: boolean = false;
  currentInvoicePage: number = 0;
  hasMoreInvoices: boolean = true;
  invoiceSearchSubject: Subject<string> = new Subject();
  invoicePageSize: number = 20;
  
  // Pagination state for mobile
  mobilePageSize: number = 10;
  mobilePageIndex: number = 0;
  
  displayedColumns: string[] = [
    'settlementDate',
    'invoiceNumber',
    'clientName',
    'settlementAmount',
    'paymentMethod',
    'remainingBalance',
    'invoiceStatus',
    'actions'
  ];

  paymentMethods = [
    { value: 'cash', label: 'Cash', icon: 'money' },
    { value: 'card', label: 'Credit/Debit Card', icon: 'credit_card' },
    { value: 'transfer', label: 'Bank Transfer', icon: 'account_balance' },
    { value: 'check', label: 'Check', icon: 'receipt_long' },
    { value: 'money', label: 'Which Money', icon: 'attach_money' }
  ];

  constructor(
    private settlementService: SettlementService,
    private invoiceService: InvoiceService,
    private receiptService: SettlementReceiptService,
    private fb: UntypedFormBuilder,
    private confirmService: AppConfirmService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.dataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    this.initForm();
    this.loadSettlements();
    this.setupInvoiceSearch();
  }
  
  ngOnDestroy() {
    this.invoiceSearchSubject.complete();
  }
  
  setupInvoiceSearch() {
    this.invoiceSearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.currentInvoicePage = 0;
        this.filteredInvoices = [];
        this.performInvoiceSearch(searchTerm, 0);
      });
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  initForm() {
    this.settlementForm = this.fb.group({
      invoiceId: [null, Validators.required],
      settlementAmount: [0, [Validators.required, Validators.min(0.01)]],
      settlementDate: [new Date(), Validators.required],
      paymentMethod: ['cash', Validators.required],
      referenceNumber: [''],
      notes: [''],
      // Payment method-specific fields (dynamic)
      cardLast4: [''],
      cardType: [''],
      bankName: [''],
      accountLast4: [''],
      checkNumber: [''],
      checkDate: [null],
      transactionId: [''],
      phoneNumber: ['']
    });
    
    // Setup payment method change listener
    this.settlementForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.onPaymentMethodChange(method);
    });
  }
  
  onPaymentMethodChange(method: string) {
    // Clear all method-specific validators first
    const methodFields = ['cardLast4', 'cardType', 'bankName', 'accountLast4', 'checkNumber', 'checkDate', 'transactionId', 'phoneNumber'];
    methodFields.forEach(field => {
      const control = this.settlementForm.get(field);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });
    
    // Add validators based on payment method
    switch(method) {
      case 'card':
        this.settlementForm.get('cardLast4')?.setValidators([Validators.required, Validators.pattern(/^\d{4}$/)]);
        this.settlementForm.get('cardType')?.setValidators([Validators.required]);
        break;
      case 'transfer':
        this.settlementForm.get('bankName')?.setValidators([Validators.required]);
        this.settlementForm.get('accountLast4')?.setValidators([Validators.pattern(/^\d{4}$/)]);
        break;
      case 'check':
        this.settlementForm.get('checkNumber')?.setValidators([Validators.required]);
        this.settlementForm.get('bankName')?.setValidators([Validators.required]);
        break;
      case 'money':
        this.settlementForm.get('transactionId')?.setValidators([Validators.required]);
        this.settlementForm.get('phoneNumber')?.setValidators([Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]);
        break;
    }
    
    // Update validity
    methodFields.forEach(field => {
      this.settlementForm.get(field)?.updateValueAndValidity();
    });
  }
  
  getCardTypes() {
    return [
      { value: 'visa', label: 'Visa' },
      { value: 'mastercard', label: 'Mastercard' },
      { value: 'amex', label: 'American Express' },
      { value: 'discover', label: 'Discover' },
      { value: 'other', label: 'Other' }
    ];
  }

  loadSettlements() {
    this.loading = true;
    this.settlementService.getAllSettlements().subscribe({
      next: (settlements) => {
        // Sort by settlement date in descending order (newest first)
        this.settlements = settlements.sort((a, b) => {
          const dateA = new Date(a.settlementDate).getTime();
          const dateB = new Date(b.settlementDate).getTime();
          return dateB - dateA; // Descending order
        });
        this.dataSource.data = this.settlements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading settlements:', error);
        this.loading = false;
        this.showError('Failed to load settlements');
      }
    });
  }

  // Invoice search modal methods
  openInvoiceModal() {
    this.showInvoiceModal = true;
    this.invoiceSearchTerm = '';
    this.currentInvoicePage = 0;
    this.filteredInvoices = [];
    this.performInvoiceSearch('', 0);
  }
  
  closeInvoiceModal() {
    this.showInvoiceModal = false;
    this.invoiceSearchTerm = '';
    this.filteredInvoices = [];
    this.currentInvoicePage = 0;
  }
  
  onInvoiceSearchChange(searchTerm: string) {
    this.invoiceSearchTerm = searchTerm;
    this.invoiceSearchSubject.next(searchTerm);
  }
  
  performInvoiceSearch(searchTerm: string, page: number) {
    this.isLoadingInvoices = true;
    
    // Build filter params for unpaid/partially paid invoices
    const params: any = {
      page: page,
      pageSize: this.invoicePageSize,
      sortBy: 'Descending'
    };
    
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    // Get invoices from the invoice service
    this.invoiceService.getInvoicesWithPagination(params).subscribe({
      next: (response: any) => {
        let invoices = response.data || [];
        
        // Filter for unpaid/partially paid invoices
        invoices = invoices.filter((inv: any) => 
          inv.status !== 'PAID' && 
          inv.status !== 'DELETED' &&
          (inv.remainingAmount || 0) > 0
        );
        
        if (page === 0) {
          this.filteredInvoices = invoices;
        } else {
          this.filteredInvoices = [...this.filteredInvoices, ...invoices];
        }
        
        this.currentInvoicePage = page;
        this.hasMoreInvoices = invoices.length === this.invoicePageSize;
        this.isLoadingInvoices = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error searching invoices:', error);
        this.isLoadingInvoices = false;
        this.showError('Failed to load invoices');
      }
    });
  }
  
  loadMoreInvoices() {
    if (!this.isLoadingInvoices && this.hasMoreInvoices) {
      this.performInvoiceSearch(this.invoiceSearchTerm, this.currentInvoicePage + 1);
    }
  }
  
  selectInvoice(invoice: any) {
    this.selectedInvoice = invoice;
    this.settlementForm.patchValue({
      invoiceId: invoice.invoiceId,
      settlementAmount: invoice.remainingAmount || 0
    });
    this.closeInvoiceModal();
  }
  
  clearSelectedInvoice() {
    this.selectedInvoice = null;
    this.settlementForm.patchValue({
      invoiceId: null,
      settlementAmount: 0
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.settlementForm.reset({
        invoiceId: null,
        settlementAmount: 0,
        settlementDate: new Date(),
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: ''
      });
      this.selectedInvoice = null;
    }
  }

  saveSettlement() {
    if (this.settlementForm.invalid) {
      this.showError('Please fill all required fields');
      return;
    }
    
    if (!this.selectedInvoice) {
      this.showError('Please select an invoice');
      return;
    }

    const formValue = this.settlementForm.value;
    const settlementAmount = parseFloat(formValue.settlementAmount);
    const remainingAmount = this.selectedInvoice.remainingAmount || 0;
    
    // STRICT VALIDATION: Settlement amount must not exceed remaining balance
    if (settlementAmount > remainingAmount) {
      this.showError(`Settlement amount ($${settlementAmount.toFixed(2)}) cannot exceed remaining balance ($${remainingAmount.toFixed(2)})`);
      return;
    }
    
    // Validate minimum amount
    if (settlementAmount <= 0) {
      this.showError('Settlement amount must be greater than $0');
      return;
    }

    this.loading = true;
    this.settlementService.createSettlement(formValue).subscribe({
      next: (response) => {
        this.showSuccess('Settlement recorded successfully');
        this.loadSettlements();
        this.toggleAddForm();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating settlement:', error);
        this.showError(error.error?.errorDescription || 'Failed to create settlement');
        this.loading = false;
      }
    });
  }

  deleteSettlement(settlement: any) {
    this.confirmService.confirm({
      title: 'Delete Settlement',
      message: `Are you sure you want to delete this settlement of $${settlement.settlementAmount}? This will reverse the payment and update the invoice balance.`
    }).subscribe(confirmed => {
      if (confirmed) {
        this.settlementService.deleteSettlement(settlement.id).subscribe({
          next: () => {
            this.showSuccess('Settlement deleted successfully');
            this.loadSettlements();
          },
          error: (error) => {
            console.error('Error deleting settlement:', error);
            this.showError('Failed to delete settlement');
          }
        });
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'accent';
      case 'DEPT': return 'warn';
      case 'PENDING': return 'warn';
      default: return 'primary';
    }
  }

  getPaymentMethodIcon(method: string): string {
    const methodObj = this.paymentMethods.find(m => m.value === method);
    return methodObj ? methodObj.icon : 'payment';
  }

  // Mobile pagination methods
  getPaginatedMobileData(): any[] {
    if (!this.dataSource || !this.dataSource.data) {
      return [];
    }
    
    // Use the paginator's current page if available
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      const endIndex = startIndex + this.paginator.pageSize;
      return this.dataSource.data.slice(startIndex, endIndex);
    }
    
    // Fallback to manual pagination
    const startIndex = this.mobilePageIndex * this.mobilePageSize;
    const endIndex = startIndex + this.mobilePageSize;
    return this.dataSource.data.slice(startIndex, endIndex);
  }

  onMobilePageChange(event: any): void {
    this.mobilePageIndex = event.pageIndex;
    this.mobilePageSize = event.pageSize;
  }

  getTotalSettlements(): number {
    return this.settlements.length;
  }

  // Receipt generation methods
  async downloadReceipt(settlement: any) {
    try {
      await this.receiptService.downloadReceipt({
        settlement,
        companyName: 'Your Company Name',
        companyAddress: '123 Business Street, City, Country',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: 'info@company.com'
      });
      this.showSuccess('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      this.showError('Failed to download receipt');
    }
  }

  async printReceipt(settlement: any) {
    try {
      await this.receiptService.printReceipt({
        settlement,
        companyName: 'Your Company Name',
        companyAddress: '123 Business Street, City, Country',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: 'info@company.com'
      });
    } catch (error) {
      console.error('Error printing receipt:', error);
      this.showError('Failed to print receipt');
    }
  }

  async viewReceipt(settlement: any) {
    try {
      await this.receiptService.viewReceipt({
        settlement,
        companyName: 'Your Company Name',
        companyAddress: '123 Business Street, City, Country',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: 'info@company.com'
      });
    } catch (error) {
      console.error('Error viewing receipt:', error);
      this.showError('Failed to view receipt');
    }
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}

