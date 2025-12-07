import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { StockAlertService, StockAlert, ReorderSuggestion } from '../../shared/services/stock-alert.service';
import { NavigationService } from '../../shared/services/navigation.service';
import { MatDialog } from '@angular/material/dialog';
import { ReorderDialogComponent } from './reorder-dialog/reorder-dialog.component';
import { AlertDetailsDialogComponent } from './alert-details-dialog/alert-details-dialog.component';

@Component({
  selector: 'app-stock-alerts',
  templateUrl: './stock-alerts.component.html',
  styleUrls: ['./stock-alerts.component.scss'],
  standalone: false
})
export class StockAlertsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stockAlerts: StockAlert[] = [];
  filteredAlertsCache: StockAlert[] = []; // Cache filtered results
  reorderSuggestions: ReorderSuggestion[] = [];
  alertStatistics: any = {};
  
  // Filter and sort options
  selectedPriority: string = 'ALL';
  selectedType: string = 'ALL';
  selectedStatus: string = 'ALL';
  sortBy: string = 'priority';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  
  // Loading states
  loading = false;
  
  // Priority options
  priorityOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'LOW', label: 'Low Priority' }
  ];
  
  // Type options
  typeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
    { value: 'REORDER_REQUIRED', label: 'Reorder Required' }
  ];
  
  // Status options
  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'GOOD', label: 'Good Stock' }
  ];

  constructor(
    private stockAlertService: StockAlertService,
    private navigationService: NavigationService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.loading = true;
    console.log('🔄 STOCK ALERTS COMPONENT: Loading data...');
    console.log('📍 Current URL:', window.location.href);
    
    // Load stock alerts
    this.stockAlertService.getStockAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alerts) => {
          console.log('✅ STOCK ALERTS COMPONENT: Received', alerts.length, 'alerts');
          console.log('📊 Full alerts data:', alerts);
          
          if (alerts.length === 0) {
            console.warn('⚠️ WARNING: No alerts returned from backend!');
            console.log('💡 TIP: Make sure you have items with totalQuantity <= minStock in the database');
          }
          
          this.stockAlerts = alerts;
          this.applyFilters(); // Apply filters after loading data
          this.loading = false;
          
          // Force change detection
          console.log('🔄 Updated stockAlerts array, length:', this.stockAlerts.length);
        },
        error: (error) => {
          console.error('❌ STOCK ALERTS COMPONENT: Error loading alerts:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error URL:', error.url);
          this.loading = false;
          this.stockAlerts = []; // Clear alerts on error
        }
      });
    
    // Load reorder suggestions
    this.stockAlertService.getReorderSuggestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(suggestions => {
        this.reorderSuggestions = suggestions;
      });
    
    // Load alert statistics
    this.stockAlertService.getAlertStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        console.log('📊 STOCK ALERTS COMPONENT: Statistics:', stats);
        this.alertStatistics = stats;
      });
  }

  // Apply filters and cache the result (called only when filters change or data loads)
  applyFilters(): void {
    if (!this.stockAlerts || this.stockAlerts.length === 0) {
      this.filteredAlertsCache = [];
      return;
    }
    
    let filtered = [...this.stockAlerts];
    console.log('🔍 STOCK ALERTS COMPONENT: Filtering from', filtered.length, 'alerts');
    
    // Filter by priority
    if (this.selectedPriority !== 'ALL') {
      filtered = filtered.filter(alert => alert.priority === this.selectedPriority);
      console.log(`📝 Priority filter (${this.selectedPriority}):`, filtered.length, 'alerts');
    }
    
    // Filter by type
    if (this.selectedType !== 'ALL') {
      filtered = filtered.filter(alert => alert.alertType === this.selectedType);
      console.log(`📝 Type filter (${this.selectedType}):`, filtered.length, 'alerts');
    }
    
    // Filter by status
    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(alert => alert.status === this.selectedStatus);
      console.log(`📝 Status filter (${this.selectedStatus}):`, filtered.length, 'alerts');
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'priority':
          const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'itemName':
          comparison = a.itemName.localeCompare(b.itemName);
          break;
        case 'currentStock':
          comparison = a.currentStock - b.currentStock;
          break;
        default:
          comparison = 0;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    console.log('✅ STOCK ALERTS COMPONENT: Final filtered alerts:', filtered.length);
    this.filteredAlertsCache = filtered;
  }
  
  get filteredAlerts(): StockAlert[] {
    return this.filteredAlertsCache;
  }

  // Get paginated alerts for display
  get paginatedAlerts(): StockAlert[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginated = this.filteredAlerts.slice(startIndex, endIndex);
    // console.log(`📄 STOCK ALERTS COMPONENT: Showing alerts ${startIndex + 1}-${Math.min(endIndex, this.filteredAlerts.length)} of ${this.filteredAlerts.length}`);
    return paginated;
  }

  // Handle page change event
  onPageChange(event: any): void {
    console.log('📄 STOCK ALERTS COMPONENT: Page changed:', event);
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  get criticalReorderSuggestions(): ReorderSuggestion[] {
    return this.reorderSuggestions.filter(suggestion => 
      suggestion.urgency === 'CRITICAL' || suggestion.urgency === 'HIGH'
    );
  }

  // Acknowledge an alert (marks the related notification as read)
  acknowledgeAlert(alert: StockAlert) {
    console.log('✅ Acknowledging alert for:', alert.itemName);
    
    this.loading = true;
    
    this.stockAlertService.acknowledgeAlert(alert)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            console.log('✅ STOCK ALERTS COMPONENT: Alert acknowledged successfully');
            
            // Reload data to remove the acknowledged alert from the list
            this.loadData();
            
            // Update badge count in sidebar
            this.stockAlertService.getAlertStatistics()
              .pipe(takeUntil(this.destroy$))
              .subscribe(stats => {
                this.navigationService.updateStockAlertsBadge(stats.total || 0);
              });
          } else {
            console.warn('⚠️ STOCK ALERTS COMPONENT: Failed to acknowledge alert');
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('❌ STOCK ALERTS COMPONENT: Error acknowledging alert:', error);
          this.loading = false;
        }
      });
  }

  openReorderDialog(suggestion: ReorderSuggestion) {
    const dialogRef = this.dialog.open(ReorderDialogComponent, {
      width: '600px',
      data: { suggestion }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after creating purchase order
      }
    });
  }

  openAlertDetails(alert: StockAlert) {
    this.dialog.open(AlertDetailsDialogComponent, {
      width: '500px',
      data: { alert }
    });
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'OUT_OF_STOCK': return 'text-red-600 bg-red-100';
      case 'LOW_STOCK': return 'text-yellow-600 bg-yellow-100';
      case 'REORDER_REQUIRED': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  onFilterChange() {
    // Reset to first page when filters change
    this.currentPage = 0;
    this.applyFilters(); // Reapply filters
    console.log('🔍 STOCK ALERTS COMPONENT: Filters changed, reset to page 0');
  }

  onSortChange() {
    // Reset to first page when sort changes
    this.currentPage = 0;
    this.applyFilters(); // Reapply filters
    console.log('🔄 STOCK ALERTS COMPONENT: Sort changed, reset to page 0');
  }

  refreshData() {
    this.loadData();
  }
}
