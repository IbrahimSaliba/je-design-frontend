import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { InventoryMovementsService, InventoryMovement, StockReport, ItemSummary, InventoryStatistics, TopItem } from './inventory-movements.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-inventory-movements',
  templateUrl: './enhanced-items.component.html',
  styleUrls: ['./enhanced-items.component.scss'],
  standalone: false
})
export class InventoryMovementsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject<void>();
  
  // Data
  items: ItemSummary[] = [];
  stockReport: StockReport[] = [];
  recentMovements: InventoryMovement[] = [];
  allMovements: InventoryMovement[] = [];
  filteredMovements: InventoryMovement[] = [];
  filteredItems: ItemSummary[] = [];
  selectedItems: ItemSummary[] = [];
  
  // Statistics data
  statistics: InventoryStatistics | null = null;
  topItems: TopItem[] = [];
  
  // Search and filters
  searchForm: FormGroup;
  
  // View options
  viewMode: 'table' | 'grid' | 'timeline' = 'table';
  movementPageSize = 25;
  movementPageIndex = 0;
  itemPageSize = 10;
  itemPageIndex = 0;
  
  // Loading states
  loading = false;
  
  // Error states
  error: string | null = null;
  hasError = false;
  
  // KPI Data
  totalStockValue = 0;
  totalItems = 0;
  lowStockItems = 0;
  monthlyMovements = 0;
  monthlyIn = 0;
  monthlyOut = 0;
  todayMovements = 0;
  lastUpdateTime: Date = new Date();

  // Top items for display
  topItemsByValue: ItemSummary[] = [];

  constructor(
    private inventoryService: InventoryMovementsService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.initSearchForm();
  }

  ngOnInit(): void {
    console.log('🎯 ENHANCED ITEMS COMPONENT: Initializing component...');
    console.log('📍 ENHANCED ITEMS: Current URL:', window.location.href);
    this.setupKeyboardShortcuts();
    this.loadData();
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      searchQuery: [''],
      movementType: [''],
      fromDate: [null],
      toDate: [null],
      showLowStockOnly: [false],
      hideZeroStock: [false],
      showValueOnly: [false]
    });
  }

  private setupSearchSubscription(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private loadData(): void {
    this.loading = true;
    this.hasError = false;
    this.error = null;
    console.log('🚀 ENHANCED ITEMS: Starting to load data...');
    
    // Load movements for the table
    this.loadMovements();
    
    // Load statistics first (primary data source)
    console.log('📡 ENHANCED ITEMS: Calling getInventoryStatistics() API...');
    this.inventoryService.getInventoryStatistics().subscribe({
      next: (stats) => {
        console.log('✅ ENHANCED ITEMS: Statistics received, processing data...');
        this.statistics = stats;
        
        // Update KPI data from statistics
        this.totalStockValue = stats.totalStockValue;
        this.totalItems = stats.totalItems;
        this.lowStockItems = stats.lowStockItems;
        this.monthlyMovements = stats.movementsThisMonth;
        this.monthlyIn = stats.stockInThisMonth;
        this.monthlyOut = stats.stockOutThisMonth;
        this.topItems = stats.topItemsByValue || [];
        
        console.log('🔄 ENHANCED ITEMS: Statistics processing complete:', {
          totalStockValue: this.totalStockValue,
          totalQuantities: this.totalItems, // Now represents total quantities
          lowStockItems: this.lowStockItems,
          movementsThisMonth: this.monthlyMovements,
          topItemsCount: this.topItems.length
        });
        
        // Load stock report for detailed table data
        this.loadStockReport();
        this.loading = false;
        console.log('✅ ENHANCED ITEMS: Statistics loading completed successfully');
      },
      error: (error) => {
        console.error('❌ ENHANCED ITEMS: Error loading statistics:', error);
        this.loading = false;
        this.hasError = true;
        this.error = this.getErrorMessage(error);
        this.snackBar.open('Failed to load inventory data. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });

    // Load recent movements (optional)
    this.inventoryService.movements$
      .pipe(takeUntil(this.destroy$))
      .subscribe(movements => {
        this.recentMovements = this.inventoryService.getRecentMovements(20);
        if (movements && movements.length > 0) {
          this.allMovements = [...movements].sort((a, b) =>
            new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()
          );
          this.calculateMonthlyStats();
          this.attachLastMovementDates();
        }
      });
  }

  private loadStockReport(): void {
    console.log('📡 ENHANCED ITEMS: Loading stock report for table data...');
        this.inventoryService.getStockReport().subscribe({
      next: (report) => {
        console.log('✅ ENHANCED ITEMS: Stock report received for table data:', report);
        this.stockReport = report;

        // Convert stock report to items for display
        this.items = report.map(stock => ({
          id: stock.itemId,
          name: stock.itemName,
          code: stock.itemCode || stock.itemId.substring(0, 8),
          picture: stock.picture || '',
          type: 'Product',
          size: stock.size || '',
          currentStock: stock.currentStock,
          totalValue: stock.totalValue,
          stockValue: stock.totalValue,
          minStock: stock.minStock ?? 0,
          status: stock.status || (stock.belowMinStock ? 'LOW_STOCK' : (stock.currentStock <= 0 ? 'OUT_OF_STOCK' : 'GOOD')),
          lastMovementDate: undefined
        }));

        this.inventoryService.updateStockReport(report);

        this.filteredItems = [...this.items];
        this.itemPageIndex = 0;
        this.updateTopItemsFromStatistics();
        this.attachLastMovementDates();
        this.calculateKPIs();

        console.log('✅ ENHANCED ITEMS: Stock report processing complete - ' + this.items.length + ' items loaded');
        console.log('🖼️  Items with pictures:', this.items.filter(i => i.picture && i.picture.length > 0).length);

        // Reapply filters with the latest items
        this.applyFilters();
      },
      error: (error) => {
        console.error('❌ ENHANCED ITEMS: Error loading stock report:', error);
      }
    });
  }

  private loadMovements(): void {
    console.log('📡 ENHANCED ITEMS: Loading all inventory movements...');
    this.inventoryService.getAllMovements().subscribe({
      next: (movements) => {
        console.log('✅ ENHANCED ITEMS: All movements received:', movements.length);
        // Sort movements by movement date (newest first)
        this.allMovements = [...movements].sort((a, b) => 
          new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()
        );
        this.filteredMovements = [...this.allMovements];

        this.inventoryService.updateMovements(this.allMovements);
        this.attachLastMovementDates();
        this.calculateMonthlyStats();
        this.applyFilters();
        console.log('✅ ENHANCED ITEMS: Movements sorted by date (newest first)');
      },
      error: (error) => {
        console.error('❌ ENHANCED ITEMS: Error loading movements:', error);
        this.hasError = true;
        this.error = this.getErrorMessage(error);
        this.snackBar.open('Failed to load movement data. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Error handling utility methods
  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    } else if (error.message) {
      return error.message;
    } else if (error.status === 0) {
      return 'Unable to connect to server. Please check your internet connection.';
    } else if (error.status === 404) {
      return 'The requested resource was not found.';
    } else if (error.status === 500) {
      return 'Internal server error. Please try again later.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  clearError(): void {
    this.hasError = false;
    this.error = null;
  }

  retryLoad(): void {
    this.clearError();
    this.loadData();
  }

  clearAllFilters(): void {
    this.searchForm.patchValue({
      searchQuery: '',
      movementType: '',
      fromDate: null,
      toDate: null,
      showLowStockOnly: false,
      hideZeroStock: false,
      showValueOnly: false
    });
    console.log('🧹 All filters cleared');
  }

  // Keyboard shortcuts
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl+R or Cmd+R for refresh
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (!this.loading) {
          this.refreshData();
        }
      }
      
      // Ctrl+E or Cmd+E for export
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        this.exportReport();
      }
      
      // Escape key to clear filters
      if (event.key === 'Escape') {
        this.clearAllFilters();
      }
    });
  }

  private calculateKPIs(): void {
    // Calculate total stock value
    if (!this.items || this.items.length === 0) {
      this.totalStockValue = 0;
      this.lowStockItems = 0;
      this.topItemsByValue = [];
      return;
    }

    this.totalStockValue = this.items.reduce((sum, item) => sum + (item.totalValue || 0), 0);

    this.lowStockItems = this.items.filter(item => {
      if (item.currentStock <= 0) {
        return true;
      }
      return item.currentStock <= item.minStock || item.status === 'LOW_STOCK';
    }).length;

    this.topItemsByValue = [...this.items]
      .filter(item => item.totalValue && item.totalValue > 0)
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
      .slice(0, 5);

    this.lastUpdateTime = new Date();
  }

  private calculateMonthlyStats(): void {
    if (!this.allMovements || this.allMovements.length === 0) {
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthlyMovements = this.allMovements.filter(movement =>
      new Date(movement.movementDate) >= startOfMonth
    );

    this.monthlyMovements = monthlyMovements.length;
    this.monthlyIn = monthlyMovements
      .filter(m => m.type === 'IN')
      .reduce((sum, m) => sum + m.quantity, 0);
    this.monthlyOut = monthlyMovements
      .filter(m => m.type === 'OUT')
      .reduce((sum, m) => sum + m.quantity, 0);

    this.todayMovements = this.allMovements.filter(movement =>
      new Date(movement.movementDate) >= startOfToday
    ).length;
  }

  private applyFilters(): void {
    const formValue = this.searchForm.value;
    
    let filteredMovements = [...this.allMovements];
    let filteredItems = [...this.items];

    console.log('🔍 APPLYING FILTERS:', formValue);

    // Search by query - search in item name and code
    if (formValue.searchQuery && formValue.searchQuery.trim()) {
      const query = formValue.searchQuery.toLowerCase().trim();
      filteredMovements = filteredMovements.filter(movement => {
        const itemName = this.getItemNameFromMovement(movement);
        const itemCode = movement.itemId.substring(0, 8);
        return itemName.toLowerCase().includes(query) ||
               itemCode.toLowerCase().includes(query);
      });
      filteredItems = filteredItems.filter(item => {
        return item.name.toLowerCase().includes(query) ||
               item.code.toLowerCase().includes(query);
      });
      console.log('📝 Search filter applied:', filteredMovements.length, 'movements match query:', query);
    }

    // Filter by movement type - filter actual movement types (IN/OUT)
    if (formValue.movementType) {
      filteredMovements = filteredMovements.filter(movement => movement.type === formValue.movementType);
      console.log('📦 Movement type filter applied:', formValue.movementType, filteredMovements.length, 'movements');
    }

    // Date filters - filter by movement date
    if (formValue.fromDate || formValue.toDate) {
      filteredMovements = filteredMovements.filter(movement => {
        const movementDate = new Date(movement.movementDate);
        const fromDate = formValue.fromDate ? new Date(formValue.fromDate) : null;
        const toDate = formValue.toDate ? new Date(formValue.toDate) : null;
        
        if (fromDate && movementDate < fromDate) return false;
        if (toDate && movementDate > toDate) return false;
        return true;
      });
      console.log('📅 Date filter applied:', filteredMovements.length, 'movements');
    }

    if (formValue.showLowStockOnly) {
        filteredItems = filteredItems.filter(item => item.currentStock <= 0 || item.currentStock <= item.minStock || item.status === 'LOW_STOCK');
        console.log('⚠️ Low stock filter applied for items:', filteredItems.length);
    }

    if (formValue.hideZeroStock) {
        filteredItems = filteredItems.filter(item => item.currentStock > 0);
        console.log('🚫 Zero stock items filtered out:', filteredItems.length);
    }

    if (formValue.showValueOnly) {
      if (this.allMovements.length > 0) {
        const medianMovementValue = this.calculateMedian(this.allMovements.map(movement => movement.totalPrice));
        filteredMovements = filteredMovements.filter(movement => movement.totalPrice >= medianMovementValue);
        console.log('💰 High value filter applied to movements (median:', medianMovementValue, '):', filteredMovements.length, 'movements');
      }

      if (this.items.length > 0) {
        const medianItemValue = this.calculateMedian(this.items.map(item => item.totalValue || 0));
        filteredItems = filteredItems.filter(item => (item.totalValue || 0) >= medianItemValue);
        console.log('💰 High value filter applied to items (median:', medianItemValue, '):', filteredItems.length, 'items');
      }
    }

    // Sort filtered results by movement date (newest first)
    this.filteredMovements = filteredMovements.sort((a, b) => 
      new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()
    );
    this.filteredItems = filteredItems.sort((a, b) => b.totalValue - a.totalValue);

    console.log('✅ FILTERING COMPLETE:', {
      movements: this.filteredMovements.length,
      items: this.filteredItems.length
    });
    
    // Reset to first page when filters change
    this.movementPageIndex = 0;
    this.itemPageIndex = 0;
  }

  // Movement styling helper methods
  getMovementTypeBadgeClass(type: string): string {
    if (type === 'IN') {
      return 'bg-green-100 text-green-800';
    } else if (type === 'OUT') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  getQuantityClass(type: string): string {
    if (type === 'IN') {
      return 'text-green-600 font-medium';
    } else if (type === 'OUT') {
      return 'text-red-600 font-medium';
    }
    return 'text-gray-600 font-medium';
  }

  getTotalPriceClass(type: string): string {
    if (type === 'IN') {
      return 'text-green-600';
    } else if (type === 'OUT') {
      return 'text-red-600';
    }
    return 'text-gray-600';
  }

  // Movement selection methods
  selectedMovements: InventoryMovement[] = [];

  isMovementSelected(movement: InventoryMovement): boolean {
    return this.selectedMovements.some(selected => selected.id === movement.id);
  }

  onMovementCheckboxChange(event: any, movement: InventoryMovement): void {
    if (event.checked) {
      if (!this.isMovementSelected(movement)) {
        this.selectedMovements.push(movement);
      }
    } else {
      this.selectedMovements = this.selectedMovements.filter(selected => selected.id !== movement.id);
    }
  }

  onMasterCheckboxChange(event: any): void {
    if (event.checked) {
      this.selectedMovements = [...this.paginatedMovements];
    } else {
      this.selectedMovements = [];
    }
  }

  // Action methods
  createMovement(type: 'IN' | 'OUT', item?: ItemSummary): void {
    // TODO: Import MovementDialogComponent and open dialog
    this.snackBar.open(`${type} movement dialog for ${item ? item.name : 'selected items'} will be implemented`, 'Close', { duration: 2000 });
  }

  viewItemHistory(item: ItemSummary): void {
    // Open dialog to show item movement history
    this.snackBar.open(`History for ${item.name} will be implemented`, 'Close', { duration: 2000 });
  }

  private getItemNameFromMovement(movement: InventoryMovement): string {
    if (movement.item?.name) {
      return movement.item.name;
    }

    const stockEntry = this.stockReport.find(stock => stock.itemId === movement.itemId);
    if (stockEntry?.itemName) {
      return stockEntry.itemName;
    }

    const cachedItem = this.items.find(item => item.id === movement.itemId);
    if (cachedItem?.name) {
      return cachedItem.name;
    }

    return 'Unknown Item';
  }

  exportReport(): void {
    try {
      console.log('📊 EXPORT: Starting export process...');
      
      // Prepare data for export
      const exportData = this.filteredMovements.map(movement => ({
        'Date': new Date(movement.movementDate).toLocaleDateString(),
        'Time': new Date(movement.movementDate).toLocaleTimeString(),
        'Item Name': this.getItemNameFromMovement(movement),
        'Item Code': movement.itemId.substring(0, 8),
        'Movement Type': movement.type,
        'Quantity': movement.quantity,
        'Unit Price': movement.unitPrice,
        'Total Price': movement.totalPrice,
        'Created By': movement.createdByName || `User ${movement.createdBy}` || 'System',
        'Related Invoice': movement.relatedInvoiceId || 'N/A'
      }));

      // Convert to CSV
      const csvContent = this.convertToCSV(exportData);
      
      // Download file
      this.downloadCSV(csvContent, `inventory-movements-${new Date().toISOString().split('T')[0]}.csv`);
      
      console.log('✅ EXPORT: Export completed successfully');
      this.snackBar.open(`Exported ${exportData.length} movements successfully`, 'Close', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
    } catch (error) {
      console.error('❌ EXPORT ERROR:', error);
      this.snackBar.open('Export failed. Please try again.', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  refreshData(): void {
    console.log('🔄 ENHANCED ITEMS: Refreshing data...');
    this.loadData();
    this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
  }

  onViewModeChange(mode: 'table' | 'grid' | 'timeline'): void {
    this.viewMode = mode;
  }


  onPageChange(event: any): void {
    this.movementPageIndex = event.pageIndex;
    this.movementPageSize = event.pageSize;
  }

  onItemPageChange(event: any): void {
    this.itemPageIndex = event.pageIndex;
    this.itemPageSize = event.pageSize;
  }

  bulkStockIn(): void {
    if (this.selectedItems.length > 0) {
      this.snackBar.open(`Bulk stock IN for ${this.selectedItems.length} items (feature coming soon)`, 'Close', { duration: 2000 });
    }
  }

  bulkStockOut(): void {
    if (this.selectedItems.length > 0) {
      this.snackBar.open(`Bulk stock OUT for ${this.selectedItems.length} items (feature coming soon)`, 'Close', { duration: 2000 });
    }
  }

  // Helper methods
  getStockClass(currentStock: number, minStock: number): string {
    if (currentStock <= 0) {
      return 'text-red-600 font-medium';
    } else if (currentStock <= minStock) {
      return 'text-orange-600 font-medium';
    } else {
      return 'text-green-600 font-medium';
    }
  }

  getStockStatus(item: ItemSummary): string {
    if (item.currentStock <= 0) {
      return 'Out of Stock';
    } else if (item.currentStock <= item.minStock || item.status === 'LOW_STOCK') {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  }

  getStatusBadgeClass(item: ItemSummary): string {
    if (item.currentStock <= 0) {
      return 'bg-red-100 text-red-800';
    } else if (item.currentStock <= item.minStock || item.status === 'LOW_STOCK') {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  }

  getUnitPrice(item: ItemSummary): number {
    if (!item || item.currentStock <= 0) {
      return 0;
    }
    return (item.totalValue || 0) / item.currentStock;
  }

  private calculateMedian(numbers: number[]): number {
    if (!numbers || numbers.length === 0) {
      return 0;
    }

    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  // Helper methods for Top Items display
  getTopItemCardClass(index: number): string {
    const colors = [
      'bg-blue-50 border-blue-500',
      'bg-gray-50 border-gray-500', 
      'bg-purple-50 border-purple-500',
      'bg-green-50 border-green-500',
      'bg-yellow-50 border-yellow-500'
    ];
    return colors[index % colors.length];
  }

  getTopItemIconClass(index: number): string {
    const colors = [
      'text-blue-600',
      'text-gray-600',
      'text-purple-600', 
      'text-green-600',
      'text-yellow-600'
    ];
    return colors[index % colors.length];
  }

  getTopItemIcon(index: number): string {
    const icons = [
      'phonelink',
      'print',
      'computer',
      'router', 
      'headset'
    ];
    return icons[index % icons.length];
  }

  getTotalTopItemsValue(): number {
    if (!this.topItemsByValue || this.topItemsByValue.length === 0) return 0;
    return this.topItemsByValue.reduce((total, item) => total + (item.totalValue || 0), 0);
  }

  getTopItemsPercentage(): number {
    if (!this.topItemsByValue || this.topItemsByValue.length === 0 || this.totalStockValue === 0) return 0;
    return (this.getTotalTopItemsValue() / this.totalStockValue) * 100;
  }

  // ===== MOVEMENT TRENDS CHART METHODS =====

  // Get trend data for the last 7 days
  getTrendData(): { date: string; stockIn: number; stockOut: number }[] {
    const trendData: { date: string; stockIn: number; stockOut: number }[] = [];
    const today = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count movements for this date
      const dayMovements = this.allMovements.filter(movement => {
        const movementDate = new Date(movement.movementDate).toISOString().split('T')[0];
        return movementDate === dateStr;
      });
      
      const stockIn = dayMovements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
      const stockOut = dayMovements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
      
      trendData.push({
        date: dateStr,
        stockIn,
        stockOut
      });
    }
    
    return trendData;
  }

  // Get chart path for SVG line
  getChartPath(type: 'IN' | 'OUT'): string {
    const data = this.getTrendData();
    const maxValue = Math.max(...data.map(d => Math.max(d.stockIn, d.stockOut)), 1);
    
    const points = data.map((item, index) => {
      const x = 20 + (index * 60); // 60px spacing between points
      const y = 140 - ((type === 'IN' ? item.stockIn : item.stockOut) / maxValue * 80); // Scale to chart height
      return `${x},${y}`;
    });
    
    return points.join(' ');
  }

  // Get chart data points for SVG circles
  getChartDataPoints(type: 'IN' | 'OUT'): { x: number; y: number; value: number }[] {
    const data = this.getTrendData();
    const maxValue = Math.max(...data.map(d => Math.max(d.stockIn, d.stockOut)), 1);
    
    return data.map((item, index) => {
      const x = 20 + (index * 60);
      const y = 140 - ((type === 'IN' ? item.stockIn : item.stockOut) / maxValue * 80);
      return { x, y, value: type === 'IN' ? item.stockIn : item.stockOut };
    });
  }

  // Get trend statistics
  getTrendStats(): { today: number; thisWeek: number; thisMonth: number; growthRate: number } {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    // Today's movements
    const todayMovements = this.allMovements.filter(m => 
      new Date(m.movementDate).toISOString().split('T')[0] === today
    ).length;
    
    // This week's movements (last 7 days)
    const thisWeekMovements = this.allMovements.filter(m => 
      new Date(m.movementDate) >= weekAgo
    ).length;
    
    // Growth rate calculation (compare this week vs previous week)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const previousWeekMovements = this.allMovements.filter(m => {
      const movementDate = new Date(m.movementDate);
      return movementDate >= twoWeeksAgo && movementDate < weekAgo;
    }).length;
    
    const growthRate = previousWeekMovements > 0 
      ? Math.round(((thisWeekMovements - previousWeekMovements) / previousWeekMovements) * 100)
      : 0;
    
    return {
      today: todayMovements,
      thisWeek: thisWeekMovements,
      thisMonth: this.monthlyMovements,
      growthRate: Math.max(0, growthRate) // Ensure non-negative for display
    };
  }

  // Get date labels for chart
  getDateLabels(): string[] {
    const labels: string[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      if (i === 6) {
        labels.push('7d ago');
      } else if (i === 3) {
        labels.push('3d ago');
      } else if (i === 1) {
        labels.push('Yesterday');
      } else if (i === 0) {
        labels.push('Today');
      } else {
        labels.push(''); // Empty for intermediate days
      }
    }
    
    return labels;
  }

  // Get total stock in for the last 7 days
  getTotalStockIn(): number {
    return this.getTrendData().reduce((sum, d) => sum + d.stockIn, 0);
  }

  // Get total stock out for the last 7 days
  getTotalStockOut(): number {
    return this.getTrendData().reduce((sum, d) => sum + d.stockOut, 0);
  }

  // Attach last movement dates to items when data is available
  private attachLastMovementDates(): void {
    if (!this.items || this.items.length === 0 || !this.allMovements || this.allMovements.length === 0) {
      return;
    }

    const latestMovementByItem = new Map<string, Date>();

    this.allMovements.forEach(movement => {
      const movementDate = new Date(movement.movementDate);
      const current = latestMovementByItem.get(movement.itemId);
      if (!current || movementDate > current) {
        latestMovementByItem.set(movement.itemId, movementDate);
      }
    });

    this.items = this.items.map(item => ({
      ...item,
      lastMovementDate: latestMovementByItem.get(item.id)?.toISOString() || item.lastMovementDate
    }));

    this.filteredItems = this.filteredItems.map(item => ({
      ...item,
      lastMovementDate: latestMovementByItem.get(item.id)?.toISOString() || item.lastMovementDate
    }));

    this.lastUpdateTime = new Date();
  }

  private updateTopItemsFromStatistics(): void {
    if (!this.topItems || this.topItems.length === 0 || !this.items || this.items.length === 0) {
      this.topItemsByValue = [];
      return;
    }

    this.topItemsByValue = this.topItems.map(topItem => {
      const matchingItem = this.items.find(item => item.id === topItem.itemId);

      return {
        id: topItem.itemId,
        name: topItem.itemName,
        code: topItem.itemCode,
        picture: matchingItem?.picture || '',
        type: matchingItem?.type || 'Product',
            size: matchingItem?.size || '',
        currentStock: topItem.currentStock,
        totalValue: topItem.stockValue,
        stockValue: topItem.stockValue,
        minStock: matchingItem?.minStock ?? 0,
        status: topItem.status,
        lastMovementDate: matchingItem?.lastMovementDate
      };
    });
  }

  get paginatedMovements(): InventoryMovement[] {
    const startIndex = this.movementPageIndex * this.movementPageSize;
    const endIndex = startIndex + this.movementPageSize;
    return this.filteredMovements.slice(startIndex, endIndex);
  }

  get paginatedItems(): ItemSummary[] {
    if (!this.filteredItems || this.filteredItems.length === 0) {
      return [];
    }
    const startIndex = this.itemPageIndex * this.itemPageSize;
    const endIndex = startIndex + this.itemPageSize;
    return this.filteredItems.slice(startIndex, endIndex);
  }

  get itemPageRange(): { start: number; end: number } {
    const start = this.filteredItems.length === 0 ? 0 : this.itemPageIndex * this.itemPageSize + 1;
    const end = Math.min((this.itemPageIndex + 1) * this.itemPageSize, this.filteredItems.length);
    return { start, end };
  }
}