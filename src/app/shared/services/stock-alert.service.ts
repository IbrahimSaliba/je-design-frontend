import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, catchError, tap, switchMap } from 'rxjs/operators';
import { JwtAuthService } from './auth/jwt-auth.service';

export interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  itemType?: string;
  picture?: string;              // Item picture (NEW)
  currentStock: number;
  reorderPoint: number;
  minStock?: number;
  unitPrice?: number;            // Unit price (NEW)
  totalValue?: number;           // Total stock value (NEW)
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_REQUIRED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status?: string;               // Item status (NEW)
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  suggestedOrderQuantity?: number;
  estimatedCost?: number;
  supplier?: string;
  containerId?: number;          // Container ID (NEW)
  containerCode?: string;        // Container code (NEW)
  containerName?: string;        // Container name (NEW)
  daysUntilStockout?: number;    // Estimated days until stockout (NEW)
}

export interface ReorderSuggestion {
  itemId: string;
  itemName: string;
  itemCode: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  estimatedCost: number;
  supplier: string;
  leadTime: number; // in days
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable({
  providedIn: 'root'
})
export class StockAlertService {
  private stockAlertsSubject = new BehaviorSubject<StockAlert[]>([]);
  private reorderSuggestionsSubject = new BehaviorSubject<ReorderSuggestion[]>([]);
  
  public stockAlerts$ = this.stockAlertsSubject.asObservable();
  public reorderSuggestions$ = this.reorderSuggestionsSubject.asObservable();
  
  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) {
    // Initialize with mock data as fallback
    // this.initializeMockData();
  }
  
  // Get count of unread stock-related notifications
  getUnreadStockAlertsCount(): Observable<number> {
    console.log('📊 STOCK ALERTS: Fetching unread count...');
    
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.apiUrl}/notifications/unread`, { headers })
      .pipe(
        map(notifications => {
          // Filter for stock-related notifications only
          const stockNotifications = notifications.filter(n => {
            const message = n.message || '';
            return message.includes('OUT OF STOCK') || 
                   message.includes('LOW STOCK') || 
                   message.includes('Low stock');
          });
          
          console.log('🔔 STOCK ALERTS: Unread stock notifications:', stockNotifications.length);
          return stockNotifications.length;
        }),
        catchError(error => {
          console.error('❌ STOCK ALERTS: Error fetching unread count:', error);
          return of(0);
        })
      );
  }
  
  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtAuth.getJwtToken();
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private initializeMockData() {
    // Mock stock alerts
    const mockAlerts: StockAlert[] = [
      {
        id: 'ALERT001',
        itemId: 'ITEM001',
        itemName: 'Premium Wireless Headphones',
        itemCode: 'PWH-001',
        currentStock: 5,
        reorderPoint: 20,
        alertType: 'LOW_STOCK',
        priority: 'HIGH',
        createdAt: new Date('2024-01-15'),
        acknowledged: false,
        suggestedOrderQuantity: 50,
        estimatedCost: 2500,
        supplier: 'Tech Supplies Inc.'
      },
      {
        id: 'ALERT002',
        itemId: 'ITEM002',
        itemName: 'USB-C Cables (3ft)',
        itemCode: 'USB-3FT',
        currentStock: 0,
        reorderPoint: 100,
        alertType: 'OUT_OF_STOCK',
        priority: 'HIGH',
        createdAt: new Date('2024-01-14'),
        acknowledged: false,
        suggestedOrderQuantity: 200,
        estimatedCost: 800,
        supplier: 'Cable Solutions Ltd.'
      },
      {
        id: 'ALERT003',
        itemId: 'ITEM003',
        itemName: 'Bluetooth Speakers',
        itemCode: 'BTS-001',
        currentStock: 8,
        reorderPoint: 15,
        alertType: 'LOW_STOCK',
        priority: 'MEDIUM',
        createdAt: new Date('2024-01-13'),
        acknowledged: true,
        acknowledgedBy: 'John Smith',
        acknowledgedAt: new Date('2024-01-13'),
        suggestedOrderQuantity: 30,
        estimatedCost: 1500,
        supplier: 'Audio Equipment Co.'
      },
      {
        id: 'ALERT004',
        itemId: 'ITEM004',
        itemName: 'Laptop Stands (Adjustable)',
        itemCode: 'LS-ADJ',
        currentStock: 3,
        reorderPoint: 10,
        alertType: 'LOW_STOCK',
        priority: 'MEDIUM',
        createdAt: new Date('2024-01-12'),
        acknowledged: false,
        suggestedOrderQuantity: 25,
        estimatedCost: 750,
        supplier: 'Office Furniture Pro'
      },
      {
        id: 'ALERT005',
        itemId: 'ITEM005',
        itemName: 'Wireless Mouse (Ergonomic)',
        itemCode: 'WM-ERG',
        currentStock: 0,
        reorderPoint: 50,
        alertType: 'OUT_OF_STOCK',
        priority: 'HIGH',
        createdAt: new Date('2024-01-11'),
        acknowledged: false,
        suggestedOrderQuantity: 100,
        estimatedCost: 2000,
        supplier: 'Peripheral Solutions'
      }
    ];

    // Mock reorder suggestions
    const mockReorderSuggestions: ReorderSuggestion[] = [
      {
        itemId: 'ITEM001',
        itemName: 'Premium Wireless Headphones',
        itemCode: 'PWH-001',
        currentStock: 5,
        reorderPoint: 20,
        suggestedQuantity: 50,
        estimatedCost: 2500,
        supplier: 'Tech Supplies Inc.',
        leadTime: 7,
        urgency: 'HIGH'
      },
      {
        itemId: 'ITEM002',
        itemName: 'USB-C Cables (3ft)',
        itemCode: 'USB-3FT',
        currentStock: 0,
        reorderPoint: 100,
        suggestedQuantity: 200,
        estimatedCost: 800,
        supplier: 'Cable Solutions Ltd.',
        leadTime: 3,
        urgency: 'CRITICAL'
      },
      {
        itemId: 'ITEM003',
        itemName: 'Bluetooth Speakers',
        itemCode: 'BTS-001',
        currentStock: 8,
        reorderPoint: 15,
        suggestedQuantity: 30,
        estimatedCost: 1500,
        supplier: 'Audio Equipment Co.',
        leadTime: 5,
        urgency: 'MEDIUM'
      },
      {
        itemId: 'ITEM004',
        itemName: 'Laptop Stands (Adjustable)',
        itemCode: 'LS-ADJ',
        currentStock: 3,
        reorderPoint: 10,
        suggestedQuantity: 25,
        estimatedCost: 750,
        supplier: 'Office Furniture Pro',
        leadTime: 10,
        urgency: 'MEDIUM'
      },
      {
        itemId: 'ITEM005',
        itemName: 'Wireless Mouse (Ergonomic)',
        itemCode: 'WM-ERG',
        currentStock: 0,
        reorderPoint: 50,
        suggestedQuantity: 100,
        estimatedCost: 2000,
        supplier: 'Peripheral Solutions',
        leadTime: 4,
        urgency: 'CRITICAL'
      }
    ];

    this.stockAlertsSubject.next(mockAlerts);
    this.reorderSuggestionsSubject.next(mockReorderSuggestions);
  }

  // Get all stock alerts from new dedicated endpoint
  getStockAlerts(): Observable<StockAlert[]> {
    console.log('📡 STOCK ALERTS: Fetching from new dedicated endpoint...');
    
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.apiUrl}/stock-alerts`, { headers })
      .pipe(
        tap(response => {
          console.log('✅ STOCK ALERTS: API response received:', response);
          console.log('📊 Total alerts from backend:', response.length);
        }),
        map(alerts => {
          // Map backend response to frontend StockAlert interface
          return alerts.map(alert => ({
            id: alert.id || alert.itemId,
            itemId: alert.itemId,
            itemName: alert.itemName,
            itemCode: alert.itemCode,
            itemType: alert.itemType,
            picture: alert.picture,
            currentStock: alert.currentStock,
            reorderPoint: alert.minStock,
            minStock: alert.minStock,
            unitPrice: alert.unitPrice,
            totalValue: alert.totalValue,
            alertType: alert.alertType as 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_REQUIRED',
            priority: alert.priority as 'HIGH' | 'MEDIUM' | 'LOW',
            status: alert.status,
            createdAt: new Date(alert.createdAt),
            acknowledged: false, // Items don't have acknowledged status
            suggestedOrderQuantity: alert.suggestedOrderQuantity,
            estimatedCost: alert.estimatedCost,
            containerId: alert.containerId,
            containerCode: alert.containerCode,
            containerName: alert.containerName,
            daysUntilStockout: alert.daysUntilStockout
          }));
        }),
        tap(alerts => {
          console.log('🔔 STOCK ALERTS: Mapped to frontend format:', alerts.length);
          this.stockAlertsSubject.next(alerts);
        }),
        catchError(error => {
          console.error('❌ STOCK ALERTS: Error fetching alerts:', error);
          console.error('Error details:', error);
          // Return empty array on error
          return of([]);
        })
      );
  }
  
  // Convert notifications to stock alerts format
  private convertNotificationsToAlerts(notifications: any[]): StockAlert[] {
    console.log('🔄 STOCK ALERTS: Converting notifications to alerts...');
    console.log('📝 STOCK ALERTS: Total notifications received:', notifications.length);
    
    return notifications
      .filter(n => {
        // Only include stock-related notifications
        const message = n.message || '';
        const isStockRelated = message.includes('OUT OF STOCK') || 
                               message.includes('LOW STOCK') || 
                               message.includes('Low stock');
        
        if (!isStockRelated) {
          console.log('⏭️ Skipping non-stock notification:', message.substring(0, 50));
        }
        
        return isStockRelated;
      })
      .map((n, index) => {
        const message = n.message || '';
        console.log(`📋 Parsing notification ${index + 1}:`, message);
        
        let itemName = 'Unknown Item';
        let itemCode = 'N/A';
        let currentStock = 0;
        let minStock = 0;
        let alertType: 'OUT_OF_STOCK' | 'LOW_STOCK' = 'LOW_STOCK';
        
        // Check for OUT OF STOCK
        const isOutOfStock = message.includes('OUT OF STOCK');
        
        // Format 1: New format - "⚠️ OUT OF STOCK: Book 123 (Code: 97864512321)..."
        if (message.includes('OUT OF STOCK:') || message.includes('LOW STOCK:')) {
          const itemNameMatch = message.match(/(?:OUT OF STOCK|LOW STOCK):\s*([^(]+)/);
          const codeMatch = message.match(/Code:\s*([^)]+)/);
          const quantityMatch = message.match(/stock is now\s+(\d+)\s+units/);
          const minStockMatch = message.match(/minimum:\s+(\d+)/);
          
          itemName = itemNameMatch ? itemNameMatch[1].trim() : 'Unknown Item';
          itemCode = codeMatch ? codeMatch[1].trim() : 'N/A';
          currentStock = quantityMatch ? parseInt(quantityMatch[1]) : 0;
          minStock = minStockMatch ? parseInt(minStockMatch[1]) : 0;
          alertType = isOutOfStock ? 'OUT_OF_STOCK' : 'LOW_STOCK';
        } 
        // Format 2: Old format - "⚠️ Low stock for item 1234 (Electronics). Current: 1, Min: 5"
        else if (message.includes('Low stock for item')) {
          const itemCodeMatch = message.match(/for item\s+([^\s(]+)/);
          const typeMatch = message.match(/\(([^)]+)\)/);
          const currentMatch = message.match(/Current:\s+(\d+)/);
          const minMatch = message.match(/Min:\s+(\d+)/);
          
          itemCode = itemCodeMatch ? itemCodeMatch[1].trim() : 'N/A';
          itemName = typeMatch ? typeMatch[1].trim() : 'Item ' + itemCode;
          currentStock = currentMatch ? parseInt(currentMatch[1]) : 0;
          minStock = minMatch ? parseInt(minMatch[1]) : 0;
          alertType = currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
        }
        
        console.log(`✅ Converted alert ${index + 1}:`, {
          itemName,
          itemCode,
          currentStock,
          minStock,
          alertType
        });
        
        return {
          id: n.id?.toString() || `ALERT-${Date.now()}`,
          itemId: n.itemId || `ITEM-${n.id}`,
          itemName: itemName,
          itemCode: itemCode,
          currentStock: currentStock,
          reorderPoint: minStock,
          alertType: alertType,
          priority: isOutOfStock || currentStock <= 0 ? 'HIGH' as const : 'MEDIUM' as const,
          createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
          acknowledged: n.read || false,
          acknowledgedBy: n.read ? 'User' : undefined,
          acknowledgedAt: n.read ? new Date(n.createdAt) : undefined
        };
      });
  }

  // Get unacknowledged alerts
  getUnacknowledgedAlerts(): Observable<StockAlert[]> {
    return new Observable(observer => {
      this.stockAlerts$.subscribe(alerts => {
        const unacknowledged = alerts.filter(alert => !alert.acknowledged);
        observer.next(unacknowledged);
      });
    });
  }

  // Get alerts by priority
  getAlertsByPriority(priority: 'HIGH' | 'MEDIUM' | 'LOW'): Observable<StockAlert[]> {
    return new Observable(observer => {
      this.stockAlerts$.subscribe(alerts => {
        const filtered = alerts.filter(alert => alert.priority === priority);
        observer.next(filtered);
      });
    });
  }

  // Acknowledge an alert by finding and marking the related notification as read
  acknowledgeAlert(alert: StockAlert): Observable<boolean> {
    console.log('✅ STOCK ALERTS: Acknowledging alert for item:', alert.itemName);
    
    const headers = this.getAuthHeaders();
    
    // First, get all unread notifications to find the matching one
    return this.http.get<any[]>(`${this.apiUrl}/notifications/unread`, { headers })
      .pipe(
        switchMap(notifications => {
          // Find notification that matches this item
          const matchingNotification = notifications.find(n => {
            const message = n.message || '';
            // Check if notification mentions this item by code or name
            return message.includes(alert.itemCode) || 
                   message.toLowerCase().includes(alert.itemName.toLowerCase());
          });
          
          if (!matchingNotification) {
            console.warn('⚠️ STOCK ALERTS: No matching notification found for item:', alert.itemName);
            return of(false);
          }
          
          console.log('📝 STOCK ALERTS: Found matching notification ID:', matchingNotification.id);
          
          // Mark the notification as read
          return this.http.put(`${this.apiUrl}/notifications/${matchingNotification.id}/read`, {}, { 
            headers,
            responseType: 'text'
          }).pipe(
            tap(response => {
              console.log('✅ STOCK ALERTS: Notification marked as read:', response);
            }),
            map(() => true),
            catchError(error => {
              console.error('❌ STOCK ALERTS: Error marking notification as read:', error);
              return of(false);
            })
          );
        }),
        catchError(error => {
          console.error('❌ STOCK ALERTS: Error fetching notifications:', error);
          return of(false);
        })
      );
  }

  // Create a new alert
  createAlert(alert: Omit<StockAlert, 'id' | 'createdAt'>): Observable<StockAlert> {
    const newAlert: StockAlert = {
      ...alert,
      id: `ALERT${Date.now()}`,
      createdAt: new Date()
    };
    
    const currentAlerts = this.stockAlertsSubject.value;
    this.stockAlertsSubject.next([newAlert, ...currentAlerts]);
    
    return of(newAlert).pipe(delay(500));
  }

  // Get reorder suggestions
  getReorderSuggestions(): Observable<ReorderSuggestion[]> {
    return this.reorderSuggestions$;
  }

  // Get critical reorder suggestions
  getCriticalReorderSuggestions(): Observable<ReorderSuggestion[]> {
    return new Observable(observer => {
      this.reorderSuggestions$.subscribe(suggestions => {
        const critical = suggestions.filter(suggestion => 
          suggestion.urgency === 'CRITICAL' || suggestion.urgency === 'HIGH'
        );
        observer.next(critical);
      });
    });
  }

  // Create purchase order from reorder suggestion
  createPurchaseOrderFromSuggestion(suggestionId: string, quantity?: number): Observable<any> {
    // This would typically create a purchase order in the system
    // For now, we'll just return a success response
    return of({
      success: true,
      purchaseOrderId: `PO${Date.now()}`,
      message: 'Purchase order created successfully'
    }).pipe(delay(1000));
  }

  // Get alert statistics from new backend endpoint
  getAlertStatistics(): Observable<any> {
    console.log('📡 STOCK ALERTS: Fetching statistics from backend...');
    
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.apiUrl}/stock-alerts/statistics`, { headers })
      .pipe(
        tap(stats => {
          console.log('✅ STOCK ALERTS: Statistics received:', stats);
        }),
        catchError(error => {
          console.error('❌ STOCK ALERTS: Error fetching statistics:', error);
          // Fallback to calculating from local data
          return new Observable(observer => {
            this.stockAlerts$.subscribe(alerts => {
              const stats = {
                total: alerts.length,
                unacknowledged: alerts.filter(a => !a.acknowledged).length,
                highPriority: alerts.filter(a => a.priority === 'HIGH').length,
                mediumPriority: alerts.filter(a => a.priority === 'MEDIUM').length,
                lowPriority: alerts.filter(a => a.priority === 'LOW').length,
                lowStock: alerts.filter(a => a.alertType === 'LOW_STOCK').length,
                outOfStock: alerts.filter(a => a.alertType === 'OUT_OF_STOCK').length
              };
              observer.next(stats);
            });
          });
        })
      );
  }

  // Check stock levels and generate alerts
  checkStockLevels(items: any[]): Observable<StockAlert[]> {
    const newAlerts: StockAlert[] = [];
    
    items.forEach(item => {
      if (item.quantity <= 0 && item.reorderPoint > 0) {
        // Out of stock
        newAlerts.push({
          id: `ALERT${Date.now()}_${item.id}`,
          itemId: item.id,
          itemName: item.name,
          itemCode: item.code,
          currentStock: item.quantity,
          reorderPoint: item.reorderPoint,
          alertType: 'OUT_OF_STOCK',
          priority: 'HIGH',
          createdAt: new Date(),
          acknowledged: false,
          suggestedOrderQuantity: item.reorderPoint * 2,
          estimatedCost: (item.reorderPoint * 2) * item.price,
          supplier: item.supplier || 'Unknown'
        });
      } else if (item.quantity <= item.reorderPoint && item.quantity > 0) {
        // Low stock
        newAlerts.push({
          id: `ALERT${Date.now()}_${item.id}`,
          itemId: item.id,
          itemName: item.name,
          itemCode: item.code,
          currentStock: item.quantity,
          reorderPoint: item.reorderPoint,
          alertType: 'LOW_STOCK',
          priority: item.quantity <= item.reorderPoint * 0.5 ? 'HIGH' : 'MEDIUM',
          createdAt: new Date(),
          acknowledged: false,
          suggestedOrderQuantity: item.reorderPoint * 2,
          estimatedCost: (item.reorderPoint * 2) * item.price,
          supplier: item.supplier || 'Unknown'
        });
      }
    });
    
    if (newAlerts.length > 0) {
      const currentAlerts = this.stockAlertsSubject.value;
      this.stockAlertsSubject.next([...newAlerts, ...currentAlerts]);
    }
    
    return of(newAlerts).pipe(delay(500));
  }
}
