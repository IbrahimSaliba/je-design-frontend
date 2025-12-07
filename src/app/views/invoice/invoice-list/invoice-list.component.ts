import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from "@angular/core";
import { MatTable as MatTable } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { UntypedFormGroup, UntypedFormBuilder } from "@angular/forms";
import { InvoiceService } from "../invoice.service";
import { AppConfirmService } from "app/shared/services/app-confirm/app-confirm.service";
import { Invoice } from "app/shared/models/invoice.model";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

@Component({
    selector: "app-invoice-list",
    templateUrl: "./invoice-list.component.html",
    styleUrls: ["./invoice-list.component.scss"],
    standalone: false
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  @ViewChild(MatTable) itemTable: MatTable<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  
  invoiceList: Invoice[] = [];
  currentRoute: string = '';
  pageTitle: string = 'Invoice List';
  loading: boolean = false;
  
  // Pagination properties
  totalElements: number = 0;
  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  
  // Filter form
  filterForm: UntypedFormGroup;
  private filterSub: Subscription;

  itemTableColumn: string[] = [
    "Invoice No.",
    "Client Name",
    "Date",
    "Status",
    "Subtotal",
    "Discount",
    "Free Items",
    "Remaining Balance",
    "Actions"
  ];

  constructor(
    private invoiceService: InvoiceService,
    private confirmService: AppConfirmService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit() {
    // Get the current route to determine which data to show
    this.currentRoute = this.route.snapshot.url[0]?.path || 'invoices';
    this.setPageConfiguration();
    this.initFilterForm();
    this.setupFilterSubscription();
    this.getInvoiceList();
  }

  ngOnDestroy() {
    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }

  setPageConfiguration() {
    switch(this.currentRoute) {
      case 'invoices':
        this.pageTitle = 'Invoices Management';
        break;
      case 'invoice-items':
        this.pageTitle = 'Invoice Items Management';
        break;
      default:
        this.pageTitle = 'Invoices Management';
    }
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      dateFrom: [''],
      dateTo: [''],
      sortBy: ['Descending']
    });
  }

  setupFilterSubscription() {
    this.filterSub = this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0; // Reset to first page on filter change
        this.getInvoiceList();
      });
  }

  getInvoiceList() {
    this.loading = true;
    
    // Use backend API for invoices with pagination
    if (this.currentRoute === 'invoices') {
      const params = {
        search: this.filterForm.get('search')?.value || '',
        status: this.filterForm.get('status')?.value || '',
        dateFrom: this.filterForm.get('dateFrom')?.value || '',
        dateTo: this.filterForm.get('dateTo')?.value || '',
        sortBy: this.filterForm.get('sortBy')?.value || 'Descending',
        page: this.currentPage,
        pageSize: this.pageSize
      };

      this.invoiceService.getInvoicesWithPagination(params)
        .subscribe((response: any) => {
          this.invoiceList = response.data || [];
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          this.currentPage = response.currentPage || 0;
          this.loading = false;
          this.cdr.detectChanges();
        });
    } else {
      // Use old method for other routes
      this.invoiceService.getInvoiceList(this.currentRoute)
        .subscribe((res: Invoice[]) => {
          this.invoiceList = res;
          this.loading = false;
          this.cdr.detectChanges();
        });
    }
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getInvoiceList();
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'Descending'
    });
  }

  calculateSubtotal(invoice: any): number {
    // Use backend calculated values if available, otherwise calculate from items
    if (invoice.totalAmountBeforeDiscount !== undefined) {
      return invoice.totalAmountBeforeDiscount;
    }
    
    // Fallback to old calculation method
    let subtotal = 0;
    if (invoice.item) {
      invoice.item.forEach(element => {
        if (!element.isFree) {
          subtotal += element.unit * element.price;
        }
      });
    }
    return subtotal;
  }

  calculateVAT(invoice: any): number {
    // This column now shows FREE ITEMS VALUE (not VAT)
    // Calculate: totalAmountBeforeDiscount - totalAmount - discountAmount = free items value
    if (invoice.totalAmountBeforeDiscount !== undefined && invoice.totalAmount !== undefined) {
      const freeItemsValue = invoice.totalAmountBeforeDiscount - invoice.totalAmount - (invoice.discountAmount || 0);
      return freeItemsValue > 0 ? freeItemsValue : 0;
    }
    
    // Fallback for old invoices (no free items tracking)
    return 0;
  }

  calculateGrandTotal(invoice: any): number {
    // Use remainingAmount from backend (shows balance after initial payment)
    if (invoice.remainingAmount !== undefined) {
      return invoice.remainingAmount;
    }
    
    // Fallback to totalAmount if remainingAmount is not available
    if (invoice.totalAmount !== undefined) {
      return invoice.totalAmount;
    }
    
    // Fallback to old calculation method
    const subtotal = this.calculateSubtotal(invoice);
    const vat = this.calculateVAT(invoice);
    const discounts = invoice.discounts || 0;
    return subtotal - vat - discounts; // VAT is deducted, not added
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'accent';
      case 'PENDING':
        return 'warn';
      case 'DEPT':
        return 'warn';
      case 'DELETED':
        return ''; // No color for deleted (will be hidden)
      default:
        return 'primary';
    }
  }

  deleteInvoiceById(id) {
    this.confirmService
      .confirm({ title: "Confirm", message: "Are you sure to delete?" })
      .subscribe(res => {
        if (res) {
          this.invoiceService.deleteInvoice(id).subscribe(e => {
            this.getInvoiceList();
          });
          this.itemTable.renderRows();
        } else return;
      });
  }
}
