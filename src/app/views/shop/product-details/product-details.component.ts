import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { egretAnimations } from "../../../shared/animations/egret-animations";
import { ShopService, CartItem } from '../shop.service';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../../shared/models/product.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.scss'],
    animations: egretAnimations,
    standalone: false
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  public productID;
  public product: Product;
  public quantity: number = 1;
  public cart: CartItem[];
  public cartData: any;
  private productSub: Subscription;

  public photoGallery: any[] = [{url: '', state: '0'}];
  constructor(
    private shopService: ShopService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.productID = this.route.snapshot.params['id'];
    this.getProduct(this.productID);
    this.getCart();
    this.cartData = this.shopService.cartData;
  }

  ngOnDestroy() {
    this.productSub.unsubscribe();
  }

  getProduct(id) {
    this.productSub = this.shopService.getProductDetails(id)
    .subscribe(res => {
      this.product = res;
      this.initGallery(this.product)
    }, err => {
      this.product = {
        _id: '',
        name: '',
        price: { sale: 0 }
      };
    })
  }
  getCart() {
    this.shopService
    .getCart()
    .subscribe(cart => {
      this.cart = cart;
    })
  }
  addToCart() {
    // Validate stock availability
    const currentCartQuantity = this.getCartQuantity();
    const requestedTotal = currentCartQuantity + this.quantity;
    const availableStock = this.product?.totalQuantity || 0;
    
    if (requestedTotal > availableStock) {
      const remaining = availableStock - currentCartQuantity;
      this.snackBar.open(
        `Cannot add ${this.quantity} items. Only ${remaining} remaining in stock (${currentCartQuantity} already in cart)`, 
        'OK', 
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      return;
    }
    
    let cartItem: CartItem = {
      product: this.product,
      data: {
        quantity: this.quantity,
        options: {}
      }
    };

    this.shopService
    .addToCart(cartItem)
    .subscribe(res => {
      this.cart = res;
      this.quantity = 1;
      this.snackBar.open(`${this.quantity} item(s) added to cart`, 'OK', { duration: 4000 });
    })
  }

  getCartQuantity(): number {
    if (!this.cart || this.cart.length === 0) {
      return 0;
    }
    
    const cartItem = this.cart.find(item => item.product._id === this.product._id);
    return cartItem ? cartItem.data.quantity : 0;
  }

  getMaxQuantity(): number {
    const currentCartQuantity = this.getCartQuantity();
    const availableStock = this.product?.totalQuantity || 0;
    return Math.max(0, availableStock - currentCartQuantity);
  }

  initGallery(product: Product) {
    console.log('🖼️ PRODUCT DETAILS: Initializing gallery for product:', product.name);
    console.log('📸 Gallery array:', product.gallery);
    console.log('📷 Main photo:', product.photo);
    
    // Check if gallery has images
    if(product.gallery && product.gallery.length > 0) {
      this.photoGallery = product.gallery.map(i => {
        return {
          url: i,
          state: '0'
        }
      });
    } else if (product.photo) {
      // If no gallery but has main photo, use that
      this.photoGallery = [{
        url: product.photo,
        state: '0'
      }];
    } else {
      // No images at all, use default
      this.photoGallery = [{
        url: 'assets/images/products/speaker-1.jpg',
        state: '0'
      }];
    }
    
    // Set first image as active
    if (this.photoGallery[0])  {
      this.photoGallery[0].state = '1';
    }
    
    console.log('✅ PRODUCT DETAILS: Gallery initialized with', this.photoGallery.length, 'images');
  }
  changeState(photo) {
    if (photo.state === '1') {
      return;
    }
    this.photoGallery = this.photoGallery.map(p => {
      if (photo.url === p.url) {
        setTimeout(() => {
          p.state = '1';
          return p;
        }, 290)
      }
      p.state = '0';
      return p;
    })
  }

}
