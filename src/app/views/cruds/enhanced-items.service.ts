import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface ItemCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ItemVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  attributes: { [key: string]: any };
  isActive: boolean;
}

export interface ItemImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  uploadedAt: Date;
}

export type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'DRAFT';

export interface EnhancedItem {
  id: string;
  name: string;
  code: string;
  sku: string;
  description: string;
  category: ItemCategory;
  variants: ItemVariant[];
  images: ItemImage[];
  
  // Inventory
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  maxStock: number;
  
  // Pricing
  basePrice: number;
  cost: number;
  margin: number;
  taxRate: number;
  
  // Physical properties
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  unit: string;
  
  // Status and tracking
  status: ItemStatus;
  isSerialized: boolean;
  isTracked: boolean;
  trackExpiry: boolean;
  expiryDate?: Date;
  
  // Supplier information
  primarySupplier: string;
  suppliers: Array<{
    id: string;
    name: string;
    sku: string;
    cost: number;
    leadTime: number;
    isPrimary: boolean;
  }>;
  
  // Sales and performance
  totalSold: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  
  // Metadata
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  
  // Barcode and identification
  barcode: string;
  qrCode: string;
  internalNotes: string;
  
  // Compliance and certifications
  certifications: string[];
  complianceNotes: string;
  
  // Location and storage
  warehouseLocation: string;
  storageRequirements: string[];
  
  // Marketing
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EnhancedItemsService {
  private itemsSubject = new BehaviorSubject<EnhancedItem[]>([]);
  private categoriesSubject = new BehaviorSubject<ItemCategory[]>([]);
  
  public items$ = this.itemsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    // No mock data initialization - using real API calls only
    // this.initializeData(); // Commented out - all data comes from backend
  }

  // MOCK DATA REMOVED - All data now comes from backend API
  // private initializeData() method has been disabled
  private initializeData() {
    // This method is no longer used - all data comes from backend API
    // Mock data initialization has been removed
    
    /*
    // Initialize categories
    const categories: ItemCategory[] = [];

    // Initialize enhanced items
    const items: EnhancedItem[] = [
      {
        id: 'item-001',
        name: 'Premium Wireless Headphones',
        code: 'PWH-001',
        sku: 'PWH-001-BLK',
        description: 'High-quality wireless headphones with noise cancellation',
        category: categories[2],
        variants: [
          {
            id: 'var-001',
            name: 'Black',
            sku: 'PWH-001-BLK',
            price: 299.99,
            cost: 150.00,
            weight: 0.3,
            dimensions: { length: 20, width: 18, height: 8 },
            attributes: { color: 'Black', material: 'Plastic' },
            isActive: true
          },
          {
            id: 'var-002',
            name: 'White',
            sku: 'PWH-001-WHT',
            price: 299.99,
            cost: 150.00,
            weight: 0.3,
            dimensions: { length: 20, width: 18, height: 8 },
            attributes: { color: 'White', material: 'Plastic' },
            isActive: true
          }
        ],
        images: [
          {
            id: 'img-001',
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
            alt: 'Premium Wireless Headphones',
            isPrimary: true,
            uploadedAt: new Date('2024-01-15')
          }
        ],
        quantity: 45,
        reservedQuantity: 5,
        availableQuantity: 40,
        reorderPoint: 20,
        reorderQuantity: 50,
        maxStock: 200,
        basePrice: 299.99,
        cost: 150.00,
        margin: 50.0,
        taxRate: 8.5,
        weight: 0.3,
        dimensions: { length: 20, width: 18, height: 8 },
        unit: 'pieces',
        status: 'ACTIVE',
        isSerialized: false,
        isTracked: true,
        trackExpiry: false,
        primarySupplier: 'Tech Supplies Inc.',
        suppliers: [
          {
            id: 'sup-001',
            name: 'Tech Supplies Inc.',
            sku: 'TS-PWH-001',
            cost: 150.00,
            leadTime: 7,
            isPrimary: true
          }
        ],
        totalSold: 1250,
        totalRevenue: 374987.50,
        averageRating: 4.5,
        reviewCount: 89,
        tags: ['wireless', 'headphones', 'premium', 'noise-cancellation'],
        notes: 'Best-selling product with excellent customer feedback',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        createdBy: 'admin',
        updatedBy: 'admin',
        barcode: '1234567890123',
        qrCode: 'QR-PWH-001',
        internalNotes: 'High margin product, consider increasing stock',
        certifications: ['CE', 'FCC'],
        complianceNotes: 'Meets all international standards',
        warehouseLocation: 'A-01-15',
        storageRequirements: ['temperature-controlled', 'dry-storage'],
        seoTitle: 'Premium Wireless Headphones - Noise Cancelling',
        seoDescription: 'High-quality wireless headphones with advanced noise cancellation technology',
        keywords: ['wireless headphones', 'noise cancelling', 'premium audio']
      },
      {
        id: 'item-002',
        name: 'USB-C Cables (3ft)',
        code: 'USB-3FT',
        sku: 'USB-3FT-BLK',
        description: 'High-speed USB-C charging and data cables',
        category: categories[1],
        variants: [
          {
            id: 'var-003',
            name: 'Black',
            sku: 'USB-3FT-BLK',
            price: 19.99,
            cost: 8.00,
            weight: 0.1,
            dimensions: { length: 91, width: 0.5, height: 0.5 },
            attributes: { color: 'Black', length: '3ft' },
            isActive: true
          }
        ],
        images: [
          {
            id: 'img-002',
            url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
            alt: 'USB-C Cable',
            isPrimary: true,
            uploadedAt: new Date('2024-01-10')
          }
        ],
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        reorderPoint: 100,
        reorderQuantity: 200,
        maxStock: 500,
        basePrice: 19.99,
        cost: 8.00,
        margin: 60.0,
        taxRate: 8.5,
        weight: 0.1,
        dimensions: { length: 91, width: 0.5, height: 0.5 },
        unit: 'pieces',
        status: 'ACTIVE',
        isSerialized: false,
        isTracked: true,
        trackExpiry: false,
        primarySupplier: 'Cable Solutions Ltd.',
        suppliers: [
          {
            id: 'sup-002',
            name: 'Cable Solutions Ltd.',
            sku: 'CS-USB-3FT',
            cost: 8.00,
            leadTime: 3,
            isPrimary: true
          }
        ],
        totalSold: 3200,
        totalRevenue: 63968.00,
        averageRating: 4.2,
        reviewCount: 156,
        tags: ['usb-c', 'cable', 'charging', 'data'],
        notes: 'Fast-moving item, frequently out of stock',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-14'),
        createdBy: 'admin',
        updatedBy: 'admin',
        barcode: '1234567890124',
        qrCode: 'QR-USB-3FT',
        internalNotes: 'Critical item - ensure adequate stock levels',
        certifications: ['USB-IF'],
        complianceNotes: 'USB-IF certified for quality assurance',
        warehouseLocation: 'B-02-08',
        storageRequirements: ['dry-storage'],
        seoTitle: 'USB-C Cables 3ft - Fast Charging & Data Transfer',
        seoDescription: 'High-quality USB-C cables for fast charging and data transfer',
        keywords: ['usb-c cable', 'charging cable', 'data cable']
      }
    ];
    */

    // Commented out: this.categoriesSubject.next(categories);
    // Commented out: this.itemsSubject.next(items);
  }

  // Items CRUD operations
  getItems(): Observable<EnhancedItem[]> {
    return this.items$;
  }

  getItemById(id: string): Observable<EnhancedItem | undefined> {
    return this.items$.pipe(
      map(items => items.find(item => item.id === id))
    );
  }

  addItem(item: Omit<EnhancedItem, 'id' | 'createdAt' | 'updatedAt'>): Observable<EnhancedItem> {
    const newItem: EnhancedItem = {
      ...item,
      id: `item-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const currentItems = this.itemsSubject.value;
    this.itemsSubject.next([...currentItems, newItem]);
    
    return of(newItem).pipe(delay(500));
  }

  updateItem(id: string, updates: Partial<EnhancedItem>): Observable<EnhancedItem> {
    const currentItems = this.itemsSubject.value;
    const itemIndex = currentItems.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
      const updatedItem = {
        ...currentItems[itemIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      currentItems[itemIndex] = updatedItem;
      this.itemsSubject.next([...currentItems]);
      
      return of(updatedItem).pipe(delay(500));
    }
    
    throw new Error(`Item with id ${id} not found`);
  }

  deleteItem(id: string): Observable<boolean> {
    const currentItems = this.itemsSubject.value;
    const filteredItems = currentItems.filter(item => item.id !== id);
    
    if (filteredItems.length < currentItems.length) {
      this.itemsSubject.next(filteredItems);
      return of(true).pipe(delay(500));
    }
    
    return of(false).pipe(delay(500));
  }

  // Categories operations
  getCategories(): Observable<ItemCategory[]> {
    return this.categories$;
  }

  getCategoryById(id: string): Observable<ItemCategory | undefined> {
    return this.categories$.pipe(
      map(categories => categories.find(cat => cat.id === id))
    );
  }

  // Search and filtering
  searchItems(query: string): Observable<EnhancedItem[]> {
    return this.items$.pipe(
      map(items => items.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.code.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ))
    );
  }

  filterItemsByCategory(categoryId: string): Observable<EnhancedItem[]> {
    return this.items$.pipe(
      map(items => items.filter(item => item.category.id === categoryId))
    );
  }

  filterItemsByStatus(status: string): Observable<EnhancedItem[]> {
    return this.items$.pipe(
      map(items => items.filter(item => item.status === status))
    );
  }

  getLowStockItems(): Observable<EnhancedItem[]> {
    return this.items$.pipe(
      map(items => items.filter(item => item.quantity <= item.reorderPoint))
    );
  }

  getOutOfStockItems(): Observable<EnhancedItem[]> {
    return this.items$.pipe(
      map(items => items.filter(item => item.quantity === 0))
    );
  }

  // Analytics and reporting
  getTopSellingItems(limit: number = 10): Observable<EnhancedItem[]> {
    return this.items$.pipe(
      map(items => items
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, limit)
      )
    );
  }

  getHighestRevenueItems(limit: number = 10): Observable<EnhancedItem[]> {
    return this.items$.pipe(
      map(items => items
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit)
      )
    );
  }

  getItemsBySupplier(supplierId: string): Observable<EnhancedItem[]> {
    return this.items$.pipe(
      map(items => items.filter(item => 
        item.suppliers.some(supplier => supplier.id === supplierId)
      ))
    );
  }

  // Bulk operations
  bulkUpdateItems(updates: Array<{ id: string; updates: Partial<EnhancedItem> }>): Observable<EnhancedItem[]> {
    const currentItems = this.itemsSubject.value;
    const updatedItems = currentItems.map(item => {
      const update = updates.find(u => u.id === item.id);
      if (update) {
        return {
          ...item,
          ...update.updates,
          updatedAt: new Date()
        };
      }
      return item;
    });
    
    this.itemsSubject.next(updatedItems);
    return of(updatedItems).pipe(delay(1000));
  }

  // Inventory operations
  adjustInventory(itemId: string, quantity: number, reason: string): Observable<EnhancedItem> {
    return this.updateItem(itemId, {
      quantity: quantity,
      availableQuantity: quantity - (this.itemsSubject.value.find(i => i.id === itemId)?.reservedQuantity || 0),
      notes: `${reason} - Inventory adjusted on ${new Date().toLocaleDateString()}`
    });
  }

  reserveQuantity(itemId: string, quantity: number): Observable<EnhancedItem> {
    const item = this.itemsSubject.value.find(i => i.id === itemId);
    if (item && item.availableQuantity >= quantity) {
      return this.updateItem(itemId, {
        reservedQuantity: item.reservedQuantity + quantity,
        availableQuantity: item.availableQuantity - quantity
      });
    }
    throw new Error('Insufficient available quantity');
  }

  releaseReservation(itemId: string, quantity: number): Observable<EnhancedItem> {
    const item = this.itemsSubject.value.find(i => i.id === itemId);
    if (item && item.reservedQuantity >= quantity) {
      return this.updateItem(itemId, {
        reservedQuantity: item.reservedQuantity - quantity,
        availableQuantity: item.availableQuantity + quantity
      });
    }
    throw new Error('Insufficient reserved quantity');
  }
}
