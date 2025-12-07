import { Component, OnInit, OnDestroy, ViewChild, forwardRef } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { ShopService, CartItem } from '../shop.service';
import { Product } from '../../../shared/models/product.model';
import { UntypedFormBuilder, UntypedFormGroup, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { egretAnimations } from '../../../shared/animations/egret-animations';
import { AppLoaderService } from '../../../shared/services/app-loader/app-loader.service';

@Component({
    selector: 'app-products',
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.scss'],
    animations: [egretAnimations],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ProductsComponent), // replace name as appropriate
            multi: true
        }
    ],
    standalone: false
})
export class ProductsComponent implements OnInit, OnDestroy {
  public isSideNavOpen: boolean;
  public viewMode: string = 'grid-view';
  public currentPage: any = 1;
  public itemsPerPage: number = 10;
  @ViewChild(MatSidenav) private sideNav: MatSidenav;

  public products$: Observable<Product[]>;
  public products: Product[] = []; // Store products for pagination calculations
  public categories$: Observable<any>;
  public activeCategory: string = 'all';
  public filterForm: UntypedFormGroup;
  public cart: CartItem[];
  public cartData: any;

  constructor(
    private shopService: ShopService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private loader: AppLoaderService
  ) { }

  ngOnInit() {
    this.categories$ = this.shopService.getCategories();
    this.buildFilterForm(this.shopService.initialFilters);
    
    setTimeout(() => {
      this.loader.open();
    });
    this.products$ = this.shopService
      .getFilteredProduct(this.filterForm)
      .pipe(
        map(products => {
          this.loader.close();
          this.products = products; // Store products for pagination calculations
          return products;
        })
      );
    this.getCart();
    this.cartData = this.shopService.cartData;
  }
  ngOnDestroy() {

  }
  getCart() {
    this.shopService
    .getCart()
    .subscribe(cart => {
      this.cart = cart;
    })
  }
  addToCart(product) {
    // Check if adding one more would exceed stock
    if (!this.canAddToCart(product)) {
      this.snackBar.open('Cannot add more - Stock limit reached!', 'OK', { 
        duration: 4000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    let cartItem: CartItem = {
      product: product,
      data: {
        quantity: 1
      }
    };
    this.shopService
    .addToCart(cartItem)
    .subscribe(cart => {
      this.cart = cart;
      this.snackBar.open('Product added to cart', 'OK', { duration: 4000 });
    })
  }

  canAddToCart(product: Product): boolean {
    // Get current quantity in cart for this product
    const cartQuantity = this.getCartQuantity(product);
    const availableStock = product.totalQuantity || 0;
    
    // Check if adding 1 more would exceed stock
    return (cartQuantity + 1) <= availableStock;
  }

  getCartQuantity(product: Product): number {
    if (!this.cart || this.cart.length === 0) {
      return 0;
    }
    
    const cartItem = this.cart.find(item => item.product._id === product._id);
    return cartItem ? cartItem.data.quantity : 0;
  }

  isOutOfStock(product: Product): boolean {
    const cartQuantity = this.getCartQuantity(product);
    const availableStock = product.totalQuantity || 0;
    return cartQuantity >= availableStock;
  }

  buildFilterForm(filterData:any = {}) {
    this.filterForm = this.fb.group({
      search: [''],
      category: ['all'],
      minPrice: [filterData.minPrice],
      maxPrice: [filterData.maxPrice],
      minRating: [filterData.minRating],
      maxRating: [filterData.maxRating]
    })
  }
  setActiveCategory(category) {
    this.activeCategory = category;
    this.filterForm.controls['category'].setValue(category)
  }

  toggleSideNav() {
    this.sideNav.opened = !this.sideNav.opened;
  }

  onPageChange(page: number) {
    this.currentPage = page;
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getTotalItems(): number {
    return this.products?.length || 0;
  }

  getDisplayedItemsRange(): string {
    const total = this.getTotalItems();
    if (total === 0) {
      return '0';
    }
    
    const start = ((this.currentPage - 1) * this.itemsPerPage) + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, total);
    
    return `${start}-${end}`;
  }
}
