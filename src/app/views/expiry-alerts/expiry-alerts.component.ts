import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpiryAlertService, ExpiryAlert, ExpiryStatistics } from './expiry-alerts.service';
import { NavigationService } from 'app/shared/services/navigation.service';

@Component({
  selector: 'app-expiry-alerts',
  templateUrl: './expiry-alerts.component.html',
  styleUrls: ['./expiry-alerts.component.scss'],
  standalone: false
})
export class ExpiryAlertsComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: MatTableDataSource<ExpiryAlert>;
  expiryAlerts: ExpiryAlert[] = [];
  statistics: ExpiryStatistics | null = null;
  
  loading = false;
  errorMessage = '';

  // Desktop columns (all)
  displayedColumns: string[] = [
    'picture',
    'itemCode',
    'itemName',
    'expiryDate',
    'daysUntilExpiry',
    'currentStock',
    'totalValue',
    'priority',
    'recommendedAction',
    'actions'
  ];
  
  // Tablet columns (condensed)
  tabletColumns: string[] = [
    'picture',
    'itemName',
    'daysUntilExpiry',
    'totalValue',
    'priority',
    'actions'
  ];

  // Filter states
  filterType: string = 'all'; // all, expired, critical, warning

  constructor(
    private expiryAlertService: ExpiryAlertService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private navService: NavigationService,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource<ExpiryAlert>([]);
  }

  ngOnInit(): void {
    console.log('📅 EXPIRY ALERTS: Component initializing...');
    this.loadExpiryAlerts();
    this.loadStatistics();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadExpiryAlerts() {
    this.loading = true;
    this.errorMessage = '';
    
    console.log('📡 EXPIRY ALERTS: Loading alerts...');
    
    this.expiryAlertService.getAllExpiryAlerts().subscribe({
      next: (alerts) => {
        console.log('✅ EXPIRY ALERTS: Received', alerts.length, 'alerts');
        this.expiryAlerts = alerts;
        this.dataSource.data = alerts;
        this.loading = false;
        
        // 🆕 Update badge count in sidebar menu
        this.navService.updateExpiryAlertsBadge(alerts.length);
        console.log('🔔 Updated Expiry Alerts badge to:', alerts.length);
        
        this.applyFilter();
        
        // 🆕 Reconnect paginator after data loads
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: (error) => {
        console.error('❌ EXPIRY ALERTS: Error loading alerts:', error);
        this.errorMessage = error.message || 'Failed to load expiry alerts';
        this.loading = false;
        this.snackBar.open('Failed to load expiry alerts', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadStatistics() {
    this.expiryAlertService.getExpiryStatistics().subscribe({
      next: (stats) => {
        console.log('✅ EXPIRY STATS: Received statistics', stats);
        this.statistics = stats;
      },
      error: (error) => {
        console.error('❌ EXPIRY STATS: Error loading statistics:', error);
      }
    });
  }

  applyFilter() {
    let filtered = [...this.expiryAlerts];
    
    switch (this.filterType) {
      case 'expired':
        filtered = filtered.filter(alert => alert.daysUntilExpiry < 0);
        break;
      case 'critical':
        filtered = filtered.filter(alert => alert.daysUntilExpiry >= 0 && alert.daysUntilExpiry <= 7);
        break;
      case 'warning':
        filtered = filtered.filter(alert => alert.daysUntilExpiry > 7 && alert.daysUntilExpiry <= 30);
        break;
      case 'all':
      default:
        // Show all
        break;
    }
    
    this.dataSource.data = filtered;
    
    // 🆕 Reset paginator to first page after filter
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  setFilter(type: string) {
    this.filterType = type;
    this.applyFilter();
  }

  refreshData() {
    this.loadExpiryAlerts();
    this.loadStatistics();
  }

  getDaysUntilExpiryClass(days: number): string {
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 3) return 'text-red-500 font-semibold';
    if (days <= 7) return 'text-orange-500 font-semibold';
    if (days <= 14) return 'text-yellow-600';
    return 'text-blue-500';
  }

  getDaysUntilExpiryText(days: number): string {
    if (days < 0) {
      const daysAgo = Math.abs(days);
      if (daysAgo === 1) return '🔴 Expired yesterday!';
      return `🔴 Expired ${daysAgo} days ago`;
    }
    if (days === 0) return '🟠 Expires today!';
    if (days === 1) return '🟡 Expires tomorrow!';
    return `Expires in ${days} days`;
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRecommendedActionText(action: string): string {
    switch (action) {
      case 'DISPOSE_IMMEDIATELY': return '🔴 Dispose Now';
      case 'DISCOUNT_SALE_OR_DISPOSE': return '⚠️ Discount or Dispose';
      case 'DISCOUNT_SALE': return '💰 Discount Sale';
      case 'PLAN_DISCOUNT': return '📋 Plan Discount';
      case 'MONITOR': return '👁️ Monitor';
      default: return action;
    }
  }

  getRecommendedActionClass(action: string): string {
    switch (action) {
      case 'DISPOSE_IMMEDIATELY': return 'text-red-600 font-bold';
      case 'DISCOUNT_SALE_OR_DISPOSE': return 'text-orange-600 font-semibold';
      case 'DISCOUNT_SALE': return 'text-yellow-600';
      case 'PLAN_DISCOUNT': return 'text-blue-600';
      case 'MONITOR': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  openDisposeDialog(alert: ExpiryAlert) {
    // Navigate to items page with info message
    this.snackBar.open(
      `Navigating to Items page. Look for item: ${alert.itemName} (${alert.itemCode})`,
      'OK',
      { duration: 4000 }
    );
    
    // Navigate and pass item code as query parameter
    this.router.navigate(['/cruds/items'], {
      queryParams: { 
        search: alert.itemCode,
        highlight: alert.itemId 
      }
    });
  }

  viewItemDetails(alert: ExpiryAlert) {
    // Navigate to items page and filter by this item code
    console.log('📋 Navigating to item details:', alert.itemCode);
    
    this.snackBar.open(
      `Opening item: ${alert.itemName}`,
      'Close',
      { duration: 2000 }
    );
    
    // Navigate to items page with search filter
    this.router.navigate(['/cruds/items'], {
      queryParams: { 
        search: alert.itemCode 
      }
    });
  }
}

