import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface InventoryMovement {
  id: string;
  movementDate: string;
  quantity: number;
  totalPrice: number;
  type: 'IN' | 'OUT';
  unitPrice: number;
  createdBy: number;
  createdByName?: string; // Added to match backend response
  itemId: string;
  relatedContainerId?: number;
  relatedInvoiceId?: string;
  item?: {
    id: string;
    name: string;
    code: string;
  };
  relatedInvoice?: {
    id: string;
    invoiceDate: string;
    totalAmount: number;
    client?: {
      id: string;
      name: string;
    };
  };
  relatedContainer?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface InventoryMovementRequest {
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unitPrice: number;
  relatedInvoiceId?: string;
  relatedContainerId?: number;
}

export interface StockReport {
  itemId: string;
  itemName: string;
  itemCode: string;
  picture?: string;         // Item image (base64 or URL)
  color?: string;           // Item color (hexadecimal color value)
  currentStock: number;
  unitPrice: number;
  totalValue: number;
  belowMinStock: boolean;
  minStock?: number;        // Minimum stock level
  status?: string;          // GOOD, LOW_STOCK, OUT_OF_STOCK
  size?: string;            // Item size label
}

export interface InventoryStatistics {
  totalStockValue: number;
  totalItems: number; // Now represents total quantities (sum of all stock levels)
  lowStockItems: number;
  movementsThisMonth: number;
  topItemsByValue: TopItem[];
  stockInThisMonth: number;
  stockOutThisMonth: number;
}

export interface TopItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  currentStock: number;
  stockValue: number;
  totalValue: number; // Add for compatibility
  status: string; // GOOD, LOW_STOCK, OUT_OF_STOCK
}

export interface ItemSummary {
  id: string;
  name: string;
  code: string;
  picture?: string;
  type?: string;
  size?: string;
  currentStock: number;
  totalValue: number;
  stockValue?: number;      // Alias for totalValue
  minStock: number;
  status: string;
  lastMovementDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryMovementsService {
  private movementsSubject = new BehaviorSubject<InventoryMovement[]>([]);
  private stockReportSubject = new BehaviorSubject<StockReport[]>([]);
  private itemsSubject = new BehaviorSubject<ItemSummary[]>([]);

  public movements$ = this.movementsSubject.asObservable();
  public stockReport$ = this.stockReportSubject.asObservable();
  public items$ = this.itemsSubject.asObservable();

  private readonly apiUrl = `http://localhost:8080/api/inventory`;

  constructor(private http: HttpClient) {}

  // Create new inventory movement
  createMovement(movement: InventoryMovementRequest): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(this.apiUrl, movement);
  }

  // Get movements by item
  getMovementsByItem(itemId: string): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.apiUrl}/item/${itemId}`);
  }

  // Get all inventory movements
  getAllMovements(): Observable<InventoryMovement[]> {
    console.log('🔍 API CALL: Getting all inventory movements from:', `${this.apiUrl}`);
    return this.http.get<InventoryMovement[]>(`${this.apiUrl}`).pipe(
      tap((response) => {
        console.log('✅ API RESPONSE: All inventory movements received:', response);
        console.log('📊 Total movements:', response?.length || 0);
      }),
      catchError((error) => {
        console.error('❌ API ERROR: Failed to get all inventory movements:', error);
        // TODO: Implement proper error handling and backend connection
        return of([]);
      })
    );
  }

  // Get stock report
  getStockReport(): Observable<StockReport[]> {
    console.log('🔍 API CALL: Getting stock report from:', `${this.apiUrl}/report`);
    return this.http.get<StockReport[]>(`${this.apiUrl}/report`).pipe(
      tap((response) => {
        console.log('✅ API RESPONSE: Stock report data received:', response);
        console.log('📊 Total items in stock report:', response?.length || 0);
      }),
      catchError((error) => {
        console.error('❌ API ERROR: Failed to get stock report:', error);
        return throwError(error);
      })
    );
  }

  // Get current stock for specific item
  getCurrentStock(itemId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/current-stock/${itemId}`);
  }

  // Get low stock items
  getLowStockItems(): Observable<StockReport[]> {
    return this.http.get<StockReport[]>(`${this.apiUrl}/low-stock`);
  }

  // Get all items (if available from another endpoint)
  getAllItems(): Observable<ItemSummary[]> {
    return this.http.get<ItemSummary[]>(`http://localhost:8080/api/items`);
  }

  // Get comprehensive inventory statistics
  getInventoryStatistics(): Observable<InventoryStatistics> {
    console.log('🔍 API CALL: Getting inventory statistics from:', `${this.apiUrl}/statistics`);
    return this.http.get<InventoryStatistics>(`${this.apiUrl}/statistics`).pipe(
      tap((response) => {
        console.log('✅ API RESPONSE: Inventory statistics received:', response);
        console.log('📊 Statistics summary:', {
          totalStockValue: response.totalStockValue,
          totalQuantities: response.totalItems, // Now represents total quantities
          lowStockItems: response.lowStockItems,
          movementsThisMonth: response.movementsThisMonth
        });
      }),
      catchError((error) => {
        console.error('❌ API ERROR: Failed to get inventory statistics:', error);
        return throwError(error);
      })
    );
  }

  // Update local state
  updateMovements(movements: InventoryMovement[]): void {
    this.movementsSubject.next(movements);
  }

  updateStockReport(report: StockReport[]): void {
    this.stockReportSubject.next(report);
  }

  updateItems(items: ItemSummary[]): void {
    this.itemsSubject.next(items);
  }

  // Helper methods
  getTotalMovementsByType(type: 'IN' | 'OUT'): number {
    return this.movementsSubject.value
      .filter(m => m.type === type)
      .reduce((sum, m) => sum + m.quantity, 0);
  }

  getTotalValueByType(type: 'IN' | 'OUT'): number {
    return this.movementsSubject.value
      .filter(m => m.type === type)
      .reduce((sum, m) => sum + m.totalPrice, 0);
  }

  getRecentMovements(limit: number = 10): InventoryMovement[] {
    return this.movementsSubject.value
      .sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime())
      .slice(0, limit);
  }
}
