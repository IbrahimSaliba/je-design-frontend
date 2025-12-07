import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ShopService, CartItem } from '../shop.service';
import { CrudService } from '../../cruds/crud.service';
import { InvoiceService, InvoiceDTO, InvoiceItemDTO } from '../invoice.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { StockAlertService } from '../../../shared/services/stock-alert.service';
import { egretAnimations } from "../../../shared/animations/egret-animations";
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.scss'],
    animations: egretAnimations,
    standalone: false
})
export class CheckoutComponent implements OnInit, OnDestroy {
  public cart: CartItem[];
  public checkoutForm: UntypedFormGroup;
  public checkoutFormAlt: UntypedFormGroup;
  public hasAltAddress: boolean;
  public countries: any[];

  public total: number;
  public subTotal: number;
  public vat: number = 0;
  public shipping: any = 'Free';
  public paymentMethod: string;

  // Simple client search properties
  public clientSearchTerm: string = '';
  public filteredClients: any[] = [];
  public selectedClient: any = null;
  public allClients: any[] = [];
  public searchType: 'name' | 'phone' = 'name';
  public downPayment: number = 0;
  public discount: number = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: UntypedFormBuilder,
    private shopService: ShopService,
    private crudService: CrudService,
    private invoiceService: InvoiceService,
    private navigationService: NavigationService,
    private stockAlertService: StockAlertService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Mock data removed - countries list can be fetched from backend API when needed
    // For now, using empty array until backend endpoint is implemented
    this.countries = [];
  }

  ngOnInit() {
    this.getCart();
    this.buildCheckoutForm();
    this.loadClients();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Update stock alerts badge in sidebar
  private updateStockAlertsBadge() {
    this.stockAlertService.getUnreadStockAlertsCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        console.log('🔔 CHECKOUT: Updating badge count to:', count);
        this.navigationService.updateStockAlertsBadge(count);
      });
  }
  calculateCost() {
    this.subTotal = 0;
    this.cart.forEach(item => {
      this.subTotal += (item.product.price.sale * item.data.quantity)
    })
    this.total = this.subTotal + (this.subTotal * (0/100));
    if(this.shipping !== 'Free') {
      this.total += this.shipping;
    }
    // Apply discount
    if(this.discount > 0) {
      this.total -= this.discount;
    }
  }
  getCart() {
    this.shopService
    .getCart()
    .subscribe(cart => {
      this.cart = cart;
      this.calculateCost();
    })
  }
  buildCheckoutForm() {
    this.checkoutForm = this.fb.group({
      country: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      company: [],
      address1: ['', Validators.required],
      address2: [],
      city: ['', Validators.required],
      zip: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', Validators.required]
    })

    this.checkoutFormAlt = this.fb.group({
      country: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      company: [],
      address1: ['', Validators.required],
      address2: [],
      city: ['', Validators.required],
      zip: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', Validators.required]
    })
  }


  placeOrder() {
    // Validate that a client is selected
    if (!this.selectedClient) {
      this.snackBar.open('Please select a client before placing the order', 'OK', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Validate that cart is not empty
    if (!this.cart || this.cart.length === 0) {
      this.snackBar.open('Your cart is empty', 'OK', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    console.log('🛒 CHECKOUT: Preparing to create invoice...');
    console.log('👤 Selected Client:', this.selectedClient);
    console.log('📦 Cart Items:', this.cart);
    console.log('💰 Total:', this.total);
    console.log('💵 Down Payment:', this.downPayment);
    console.log('🎫 Discount:', this.discount);

    // Prepare invoice items from cart
    const invoiceItems: InvoiceItemDTO[] = this.cart.map(cartItem => ({
      itemId: cartItem.product._id,
      quantity: cartItem.data.quantity,
      unitPrice: cartItem.product.price.sale,
      isFree: false
    }));

    // Prepare invoice DTO
    const invoiceDTO: InvoiceDTO = {
      clientId: this.selectedClient.id,
      discountAmount: this.discount || 0, // Discount in dollars, not percentage
      initialPayment: this.downPayment || 0,
      deductFromStock: 'Y', // Always deduct stock for shop orders
      paymentMethod: this.paymentMethod || 'cash', // Payment method selected by user
      items: invoiceItems
    };

    console.log('📝 CHECKOUT: Invoice DTO:', invoiceDTO);
    console.log('💳 Payment Method:', this.paymentMethod);

    // Create the invoice
    this.invoiceService.createInvoice(invoiceDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ CHECKOUT: Invoice created successfully:', response);
          
          if (response.errorCode === '000000') {
            // Clear the cart
            this.shopService.cart = [];
            this.shopService.updateCount();
            
            // Get invoice number from response if available
            const invoiceNumber = response.responseData?.invoiceNumber;
            const invoiceId = response.responseData?.invoiceId;
            
            // Show success message with invoice number (if available)
            if (invoiceNumber) {
              this.snackBar.open(`Order placed successfully! Invoice ${invoiceNumber} created.`, 'OK', {
                duration: 6000,
                panelClass: ['success-snackbar']
              });
            } else {
              this.snackBar.open('Order placed successfully!', 'OK', {
                duration: 6000,
                panelClass: ['success-snackbar']
              });
            }
            
            console.log('✅ Invoice created:', {
              invoiceNumber: invoiceNumber,
              invoiceId: invoiceId,
              clientName: this.selectedClient.name,
              total: response.responseData?.totalAmount,
              status: response.responseData?.status
            });
            
            // Update sidebar badge immediately (stock may have changed)
            this.updateStockAlertsBadge();
            
            // Redirect to shop or invoice page
            setTimeout(() => {
              this.router.navigate(['/shop']);
            }, 2500);
          } else {
            this.snackBar.open('Error creating invoice: ' + response.errorDescription, 'OK', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('❌ CHECKOUT: Error creating invoice:', error);
          this.snackBar.open('Failed to create invoice. Please try again.', 'OK', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Client search methods
  loadClients() {
    this.crudService.getItems('clients')
      .pipe(takeUntil(this.destroy$))
      .subscribe(clients => {
        this.allClients = clients;
        console.log('Loaded clients:', clients);
      });
  }


  onClientSelected(client: any) {
    this.selectedClient = client;
    this.populateBillingForm(client);
  }

  populateBillingForm(client: any) {
    if (!client) return;

    // Split name into first and last name
    const nameParts = client.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Update form with client data
    this.checkoutForm.patchValue({
      firstName: firstName,
      lastName: lastName,
      email: client.email,
      phone: client.phone,
      address1: client.address
    });

    // Also update alternative address form if it exists
    if (this.checkoutFormAlt) {
      this.checkoutFormAlt.patchValue({
        firstName: firstName,
        lastName: lastName,
        email: client.email,
        phone: client.phone,
        address1: client.address
      });
    }
  }

  clearClientSelection() {
    this.selectedClient = null;
    this.clientSearchTerm = '';
    this.filteredClients = [];
    this.populateBillingForm(null);
  }

  createNewClient() {
    // This would open a dialog to create a new client
    // For now, we'll just log to console
    console.log('Opening new client creation dialog...');
    alert('Client creation dialog would open here. This feature can be implemented with a modal dialog.');
  }

  trackByClientId(index: number, client: any): string {
    return client?.id || index;
  }

  // Simple search methods
  setSearchType(type: 'name' | 'phone') {
    this.searchType = type;
    this.clientSearchTerm = '';
    this.filteredClients = [];
  }

  searchClients(searchTerm: string) {
    this.clientSearchTerm = searchTerm;
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      this.filteredClients = [];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    
    if (this.searchType === 'name') {
      this.filteredClients = this.allClients.filter(client => 
        client.name.toLowerCase().includes(term)
      );
    } else {
      this.filteredClients = this.allClients.filter(client => 
        client.phone.toLowerCase().includes(term)
      );
    }
  }
}
