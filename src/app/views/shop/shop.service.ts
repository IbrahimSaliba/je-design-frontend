
import {throwError as observableThrowError,  Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../shared/models/product.model';
import { UntypedFormGroup } from '@angular/forms';

import { of, combineLatest } from 'rxjs';
import { startWith, debounceTime, delay, map, switchMap, catchError } from 'rxjs/operators';



export interface CartItem {
  product: Product;
  data: {
    quantity: number,
    options?: any
  };
}

@Injectable()
export class ShopService {
  public products: Product[] = [];
  public initialFilters = {
    minPrice: 0,
    maxPrice: 10000, // Increased to accommodate all products
    minRating: 1,
    maxRating: 5
  };

  public cart: CartItem[] = [];
  public cartData = {
    itemCount: 0
  }
  
  private readonly apiUrl = 'http://localhost:8080/api/items';
  
  constructor(private http: HttpClient) { }
  public getCart(): Observable<CartItem[]> {
    return of(this.cart)
  }
  public addToCart(cartItem: CartItem): Observable<CartItem[]> {
    let index = -1;
    this.cart.forEach((item, i) => {
      if(item.product._id === cartItem.product._id) {
        index = i;
      }
    })
    if(index !== -1) {
      this.cart[index].data.quantity += cartItem.data.quantity;
      this.updateCount();
      return of(this.cart)
    } else {
      this.cart.push(cartItem);
      this.updateCount();
      return of(this.cart)
    }
  }
  public updateCount() {
    this.cartData.itemCount = 0;
    this.cart.forEach(item => {
      this.cartData.itemCount += item.data.quantity;
    })
  }
  public removeFromCart(cartItem: CartItem): Observable<CartItem[]> {
    this.cart = this.cart.filter(item => {
      if(item.product._id == cartItem.product._id) {
        return false;
      }
      return true;
    });
    this.updateCount();
    return of(this.cart)
  }
  public getProducts(): Observable<Product[]> {
    console.log('🛒 SHOP: Calling backend API to get items...');
    
    // Call the backend /api/items/filter endpoint
    // Exclude DELETED and OUT_OF_STOCK items (only show IN_STOCK and LOW_STOCK)
    const filterPayload = {
      page: 0,
      pageSize: 1000, // Get all items
      sortBy: 'Ascending',
      status: '' // We'll filter on frontend to allow both IN_STOCK and LOW_STOCK
    };
    
    return this.http.post(`${this.apiUrl}/filter`, filterPayload)
      .pipe(
        delay(100),
        map((response: any) => {
          console.log('✅ SHOP: Backend response received:', response);
          console.log('🔍 SHOP: Response structure check:', {
            hasErrorCode: !!response.errorCode,
            errorCode: response.errorCode,
            hasResponseData: !!response.responseData,
            responseDataType: typeof response.responseData,
            hasData: !!(response.responseData && response.responseData.data),
            dataLength: response.responseData?.data?.length
          });
          
          // Check if response has the expected structure
          if (response.errorCode === "000000" && response.responseData) {
            const items = response.responseData.data || response.responseData;
            console.log('📦 SHOP: Total items loaded from backend:', items.length);
            
            // Filter out OUT_OF_STOCK items (only show IN_STOCK and LOW_STOCK)
            const availableItems = items.filter((item: any) => 
              item.status === 'IN_STOCK' || item.status === 'LOW_STOCK'
            );
            console.log('🔍 SHOP: Items after filtering OUT_OF_STOCK:', availableItems.length);
            console.log('📝 SHOP: Available items:', availableItems);
            
            // Convert backend items to Product format
            const products = this.convertItemsToProducts(availableItems);
            this.products = products;
            console.log('🎯 SHOP: Final products array length:', products.length);
            console.log('🎯 SHOP: Final products:', products);
            return products;
          } else {
            console.error('❌ SHOP: API Error:', response.errorDescription);
            // Return empty array if backend fails (mock data removed)
            return [];
          }
        }),
        catchError((error) => {
          console.error('❌ SHOP: HTTP Error:', error);
          // Return empty array when API fails (mock data removed)
          return of([]);
        })
      );
  }

  private convertItemsToProducts(items: any[]): Product[] {
    console.log('🔄 SHOP: Converting items to products. Total items:', items.length);
    console.log('📝 SHOP: Items to convert:', items);
    
    if (!items || !Array.isArray(items)) {
      console.error('❌ SHOP: Items is not an array:', items);
      return [];
    }
    
    const products = items.map((item, index) => {
      console.log(`🔧 SHOP: Converting item ${index + 1}:`, {
        id: item.id,
        name: item.name,
        type: item.type,
        code: item.code,
        finalPrice: item.finalPrice || item.final_price
      });
      
      const product = {
        _id: item.id,
        name: item.name || item.type || 'Unknown Item', // Use name first, then type
        code: item.code || '',
        description: item.description || 'No description available',
        category: (item.type || 'general').toLowerCase(),
        type: item.type || 'General',
        size: item.size || item?.size || null,
        tags: [item.type, item.code].filter(Boolean),
        price: {
          sale: item.finalPrice || item.final_price || 0, // Support both camelCase and snake_case
          previous: item.initialPriceUsd || item.initial_price_usd || item.finalPrice || item.final_price || 0
        },
        totalQuantity: item.totalQuantity || item.total_quantity || 0,
        piecesPerBox: item.piecesPerBox || item.pieces_per_box || 0,
        color: item.color || null, // Include color from backend
        ratings: {
          rating: 4.5,
          ratingCount: 10
        },
        features: [],
        photo: this.getProductPhoto(item),
        gallery: this.getProductGallery(item),
        badge: {
          text: item.status === 'LOW_STOCK' ? 'Low Stock' : item.status === 'IN_STOCK' ? 'In Stock' : '',
          color: item.status === 'LOW_STOCK' ? 'warn' : 'primary'
        }
      };
      
      console.log(`✅ SHOP: Converted item ${index + 1} - "${product.name}" (${product.category}) - $${product.price.sale}`);
      return product;
    });
    
    console.log('✅ SHOP: Total products after conversion:', products.length);
    console.log('📋 SHOP: All converted products:', products);
    return products;
  }

  private getProductPhoto(item: any): string {
    // Priority order: pictures array > picture field > category-based default
    
    // Check pictures array
    if (item.pictures && Array.isArray(item.pictures) && item.pictures.length > 0 && item.pictures[0]) {
      console.log(`🖼️ SHOP: Using pictures array for item ${item.name}:`, item.pictures[0]);
      return item.pictures[0];
    }
    
    // Check single picture field
    if (item.picture && item.picture.trim() !== '') {
      console.log(`🖼️ SHOP: Using picture field for item ${item.name}:`, item.picture);
      return item.picture;
    }
    
    // Generate a default image based on item type/category
    const defaultImage = this.getDefaultImageByType(item.type);
    console.log(`🖼️ SHOP: No picture found for item ${item.name}, using default for type ${item.type}:`, defaultImage);
    return defaultImage;
  }

  private getProductGallery(item: any): string[] {
    if (item.pictures && Array.isArray(item.pictures) && item.pictures.length > 0) {
      return item.pictures.filter(p => p && p.trim() !== '');
    }
    
    if (item.picture && item.picture.trim() !== '') {
      return [item.picture];
    }
    
    return [];
  }

  private getDefaultImageByType(type: string): string {
    if (!type) {
      return 'assets/images/products/speaker-1.jpg';
    }
    
    const typeMap: {[key: string]: string} = {
      'books': 'assets/images/products/headphone-2.jpg',
      'flower': 'assets/images/products/headphone-3.jpg',
      'electronics': 'assets/images/products/speaker-1.jpg',
      'gadget': 'assets/images/products/speaker-2.jpg',
      'ceramic': 'assets/images/products/headphone-1.jpg',
      'plant': 'assets/images/products/headphone-4.jpg'
    };
    
    const lowerType = type.toLowerCase();
    return typeMap[lowerType] || 'assets/images/products/speaker-1.jpg';
  }
  public getProductDetails(productID): Observable<Product> {
    console.log('🔍 SHOP: Getting product details for ID:', productID);
    
    // Try to find in already loaded products first
    let product = this.products.find(p => p._id === productID);
    if (product) {
      console.log('✅ SHOP: Product found in cache');
      return of(product);
    }
    
    // If not found, try to fetch from backend
    return this.http.get(`${this.apiUrl}/${productID}`)
      .pipe(
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            const item = response.responseData;
            const products = this.convertItemsToProducts([item]);
            return products[0];
          } else {
            throw new Error('Product not found!');
          }
        }),
        catchError((error) => {
          console.error('❌ SHOP: Error fetching product details:', error);
          // Return error if backend fails (mock data removed)
          return observableThrowError(new Error('Product not found!'));
        })
      );
  }
  public getCategories(): Observable<any> {
    // Extract unique categories from loaded products
    if (this.products && this.products.length > 0) {
      const categories = [...new Set(this.products.map(p => p.category))];
      console.log('📂 SHOP: Categories from products:', categories);
      return of(categories);
    }
    
    // Fallback to default categories
    let categories = ['speaker', 'headphone', 'watch', 'phone', 'flower', 'electronics', 'books'];
    return of(categories);
  }

  public getFilteredProduct(filterForm: UntypedFormGroup): Observable<Product[]> {
    return combineLatest(
      this.getProducts(),
      filterForm.valueChanges
      .pipe(
        startWith(this.initialFilters),
        debounceTime(400)
      )
    )
    .pipe(
      switchMap(([products, filterData]) => {
        return this.filterProducts(products, filterData);
      })
    )

  }
  /*
  * If your data set is too big this may raise performance issue.
  * You should implement server side filtering instead.
  */ 
  private filterProducts(products: Product[], filterData): Observable<Product[]> {
    let filteredProducts = products.filter(p => {
      let isMatch: Boolean;
      let match = {
        search: false,
        caterory: false,
        price: false,
        rating: false
      };
      // Search
      if (
        !filterData.search
        || p.name.toLowerCase().indexOf(filterData.search.toLowerCase()) > -1
        || p.description.indexOf(filterData.search) > -1
        || p.tags.indexOf(filterData.search) > -1
      ) {
        match.search = true;
      } else {
        match.search = false;
      }
      // Category filter
      if (
        filterData.category === p.category 
        || !filterData.category 
        || filterData.category === 'all'
      ) {
        match.caterory = true;
      } else {
        match.caterory = false;
      }
      // Price filter
      if (
        p.price.sale >= filterData.minPrice 
        && p.price.sale <= filterData.maxPrice
      ) {
        match.price = true;
      } else {
        match.price = false;
      }
      // Rating filter
      if(
        p.ratings.rating >= filterData.minRating 
        && p.ratings.rating <= filterData.maxRating
      ) {
        match.rating = true;
      } else {
        match.rating = false;
      }
      
      for(let m in match) {
        if(!match[m]) return false;
      }

      return true;
    })
    return of(filteredProducts)
  }
}
