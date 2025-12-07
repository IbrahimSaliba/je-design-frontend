import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CrudService } from '../crud.service';
import { MatDialogRef as MatDialogRef, MatDialog as MatDialog } from '@angular/material/dialog';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { AppConfirmService } from '../../../shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from '../../../shared/services/app-loader/app-loader.service';
import { NgxTablePopupComponent } from './ngx-table-popup/ngx-table-popup.component';
import { StockAdjustmentDialogComponent } from '../stock-adjustment-dialog/stock-adjustment-dialog.component';
import { ImagePreviewDialogComponent } from './image-preview-dialog/image-preview-dialog.component';
import { Subscription } from 'rxjs';
import { egretAnimations } from "../../../shared/animations/egret-animations";
import { MatTableDataSource as MatTableDataSource } from '@angular/material/table';
import { MatPaginator as MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-crud-ngx-table',
    templateUrl: './crud-ngx-table.component.html',
    animations: egretAnimations,
    standalone: false
})
export class CrudNgxTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  public dataSource: any;
  public displayedColumns: any;
  public getItemSub: Subscription;
  public paginatorSub: Subscription;
  public currentRoute: string = '';
  public pageTitle: string = 'CRUD Table';
  
  // Search form
  public searchForm: FormGroup;
  public showFilters: boolean = false;
  public loading: boolean = false;
  public isInitialized: boolean = false;
  
  // API parameters
  public apiParams = {
    page: 0,
    pageSize: 10,
    sortBy: 'Descending',
    fromDate: '',
    toDate: '',
    status: '',
    search: '',
    minPrice: null,
    maxPrice: null,
    colorFilter: ''
  };
  
  // Pagination data from backend
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  private isUpdatingPagination: boolean = false;
  
  // Status options for containers
  public statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];
  
  constructor(
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private crudService: CrudService,
    private confirmService: AppConfirmService,
    private loader: AppLoaderService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    // Get the current route to determine which data to show
    this.currentRoute = this.route.snapshot.url[0]?.path || 'containers';
    this.setPageConfiguration();
    this.updateDisplayedColumns(window.innerWidth);
    
    // Initialize dataSource with empty array to prevent template errors
    this.dataSource = new MatTableDataSource([]);
    
    this.initializeSearchForm();
    this.isInitialized = true;
    
    this.getItems();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    const width = (event.target as Window).innerWidth;
    this.updateDisplayedColumns(width);
  }

  private updateDisplayedColumns(viewportWidth: number) {
    switch (this.currentRoute) {
      case 'items':
        this.displayedColumns = this.getItemColumnsForWidth(viewportWidth);
        break;
      case 'containers':
        this.displayedColumns = this.getContainerColumnsForWidth(viewportWidth);
        break;
      default:
        this.displayedColumns = this.getDisplayedColumns();
    }
  }

  private getContainerColumnsForWidth(viewportWidth: number): string[] {
    if (viewportWidth >= 1440) {
      return ['id', 'code', 'name', 'type', 'size', 'cbm', 'status', 'shipping_agency', 'container_price', 'actions'];
    }

    if (viewportWidth >= 1280) {
      return ['code', 'name', 'type', 'size', 'cbm', 'status', 'shipping_agency', 'container_price', 'actions'];
    }

    if (viewportWidth >= 1024) {
      return ['code', 'name', 'type', 'status', 'container_price', 'actions'];
    }

    return ['code', 'name', 'status', 'container_price', 'actions'];
  }

  private getItemColumnsForWidth(viewportWidth: number): string[] {
    if (viewportWidth >= 1440) {
      return ['pictures', 'code', 'name', 'size', 'status', 'total_quantity', 'final_price', 'actions'];
    }

    if (viewportWidth >= 1280) {
      return ['pictures', 'code', 'name', 'size', 'status', 'total_quantity', 'final_price', 'actions'];
    }

    if (viewportWidth >= 1100) {
      return ['code', 'name', 'size', 'status', 'total_quantity', 'final_price', 'actions'];
    }

    if (viewportWidth >= 900) {
      return ['code', 'name', 'size', 'status', 'final_price', 'actions'];
    }

    return ['code', 'name', 'status', 'final_price', 'actions'];
  }

  initializeSearchForm() {
    this.searchForm = this.fb.group({
      search: [''],
      status: [''],
      fromDate: [''],
      toDate: [''],
      sortBy: ['Descending'],
      minPrice: [null],
      maxPrice: [null],
      colorFilter: ['']
    });
    
    // Listen to form changes for real-time filtering with optimized debounce
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500), // Increased debounce for better performance
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.isInitialized) {
          this.applyFilters();
        }
      });
  }
  
  setPageConfiguration() {
    switch(this.currentRoute) {
      case 'containers':
        this.pageTitle = 'Containers Management';
        break;
      case 'items':
        this.pageTitle = 'Items Management';
        break;
      case 'clients':
        this.pageTitle = 'Clients Management';
        break;
      case 'suppliers':
        this.pageTitle = 'Suppliers Management';
        break;
      default:
        this.pageTitle = 'Containers Management';
    }
  }

  getSearchLabel(): string {
    switch(this.currentRoute) {
      case 'containers':
        return 'Search by Container Code';
      case 'items':
        return 'Search by Item Code';
      case 'clients':
        return 'Search by Client Name';
      case 'suppliers':
        return 'Search by Supplier Name';
      default:
        return 'Search';
    }
  }
  ngAfterViewInit() {
    // Set up paginator and sort after view is initialized
    this.setupTable();
    
    // Listen to pagination changes for containers, items, clients, and suppliers
    if ((this.currentRoute === 'containers' || this.currentRoute === 'items' || this.currentRoute === 'clients' || this.currentRoute === 'suppliers') && this.paginator) {
      this.paginatorSub = this.paginator.page.subscribe(event => {
        // Prevent recursive calls
        if (this.isUpdatingPagination) {
          return;
        }
        
        // Update API parameters
        this.apiParams.page = event.pageIndex;
        this.apiParams.pageSize = event.pageSize;
        this.currentPage = event.pageIndex;
        
        // Call getItems to fetch new data
        this.getItems();
      });
    }
  }
  
  setupTable() {
    // Only set up sorting, not pagination (we handle pagination manually for backend API)
    if (this.dataSource && this.sort) {
      this.dataSource.sort = this.sort;
    }
    // Don't assign paginator to dataSource for containers, items, clients, and suppliers - we handle it manually
    if (this.currentRoute !== 'containers' && this.currentRoute !== 'items' && this.currentRoute !== 'clients' && this.currentRoute !== 'suppliers' && this.dataSource && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }
  ngOnDestroy() {
    if (this.getItemSub) {
      this.getItemSub.unsubscribe()
    }
    if (this.paginatorSub) {
      this.paginatorSub.unsubscribe()
    }
  }

  getDisplayedColumns() {
    switch(this.currentRoute) {
      case 'containers':
        return ['id', 'code', 'name', 'type', 'size', 'cbm', 'status', 'shipping_agency', 'container_price', 'actions'];
      case 'items':
        return ['pictures', 'code', 'name', 'size', 'status', 'total_quantity', 'final_price', 'actions'];
      case 'clients':
        return ['name', 'email', 'phone', 'client_type', 'status', 'address', 'actions'];
      case 'suppliers':
        return ['code', 'name', 'contact_name', 'email', 'status', 'country', 'actions'];
      default:
        return ['name', 'age', 'balance', 'company', 'status', 'actions'];
    }
  }

  getItems() {
    // Ensure dataSource is initialized
    if (!this.dataSource) {
      this.dataSource = new MatTableDataSource([]);
    }
    
    // Only show loading for initial load, not for search/filter operations
    if (!this.dataSource.data || this.dataSource.data.length === 0) {
      this.loading = true;
    }
    
    // Update API parameters from form
    this.updateApiParams();
    
    // Use filtered API for containers, items, clients, and suppliers
    if (this.currentRoute === 'containers' || this.currentRoute === 'items' || 
        this.currentRoute === 'clients' || this.currentRoute === 'suppliers') {
      this.getItemSub = this.crudService.getItemsWithFilters(this.currentRoute, this.apiParams)
        .subscribe({
          next: (response) => {
            // Handle paginated response for containers, items, clients, and suppliers
            if ((this.currentRoute === 'containers' || this.currentRoute === 'items' || this.currentRoute === 'clients' || this.currentRoute === 'suppliers') && response && typeof response === 'object' && response.data) {
              // Update pagination metadata
              this.totalElements = response.totalElements || 0;
              this.totalPages = response.totalPages || 0;
              this.currentPage = response.currentPage || 0;
              
              // Update dataSource with the data array
              if (this.dataSource) {
                const processedData = this.processFetchedData(response.data);
                this.dataSource.data = processedData;
              } else {
                const processedData = this.processFetchedData(response.data);
                this.dataSource = new MatTableDataSource(processedData);
                this.setupTable();
              }
              
              // Update paginator if it exists - use flag to prevent recursive calls
              if (this.paginator) {
                this.isUpdatingPagination = true;
                
                this.paginator.length = this.totalElements;
                this.paginator.pageIndex = this.currentPage;
                this.paginator.pageSize = response.pageSize || this.apiParams.pageSize;
                
                // Reset flag after a short delay to allow UI to update
                setTimeout(() => {
                  this.isUpdatingPagination = false;
                }, 100);
              }
            } else {
              // Handle non-paginated response (for other entities)
              if (this.dataSource) {
                const processedData = this.processFetchedData(response);
                this.dataSource.data = processedData;
              } else {
                const processedData = this.processFetchedData(response);
                this.dataSource = new MatTableDataSource(processedData);
                this.setupTable();
              }
            }
            this.loading = false;
          },
          error: (error) => {
            console.error(`Error fetching ${this.currentRoute}:`, error);
            this.loading = false;
            this.snack.open(`Error loading ${this.currentRoute}`, 'OK', { duration: 3000 });
          }
        });
    } else {
      // For other entities, use the existing method
      this.getItemSub = this.crudService.getItems(this.currentRoute)
        .subscribe({
          next: (data) => {
            // Update existing dataSource instead of creating new one
            if (this.dataSource) {
              this.dataSource.data = data;
            } else {
              this.dataSource = new MatTableDataSource(data);
              this.setupTable();
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error fetching items:', error);
            this.loading = false;
            this.snack.open('Error loading data', 'OK', { duration: 3000 });
          }
        });
    }
  }
  
  updateApiParams() {
    const formValue = this.searchForm.value;
    
    this.apiParams = {
      page: this.paginator?.pageIndex || 0,
      pageSize: this.paginator?.pageSize || 10,
      sortBy: formValue.sortBy || 'Descending',
      fromDate: this.formatDateForAPI(formValue.fromDate),
      toDate: this.formatDateForAPI(formValue.toDate),
      status: formValue.status || '',
      search: formValue.search || '',
      minPrice: formValue.minPrice || null,
      maxPrice: formValue.maxPrice || null,
      colorFilter: formValue.colorFilter || ''
    };
    
    // Debug logging (commented out for performance)
    // console.log('Search form value:', formValue);
    // console.log('API params:', this.apiParams);
  }
  
  formatDateForAPI(date: any): string {
    if (!date) return '';
    
    // Convert date to dd/MM/yyyy format
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  applyFilters() {
    // Reset to first page when applying filters
    this.apiParams.page = 0;
    this.currentPage = 0;
    
    if (this.paginator) {
      this.isUpdatingPagination = true;
      this.paginator.pageIndex = 0;
      setTimeout(() => {
        this.isUpdatingPagination = false;
      }, 100);
    }
    this.getItems();
  }

  private processFetchedData(data: any): any[] {
    if (!Array.isArray(data)) {
      return [];
    }

    if (this.currentRoute !== 'items') {
      return data;
    }

    return this.applyClientSideItemFilters(data);
  }
  
  clearFilters() {
    this.searchForm.reset({
      search: '',
      status: '',
      fromDate: '',
      toDate: '',
      sortBy: 'Descending',
      minPrice: null,
      maxPrice: null,
      colorFilter: ''
    });
    this.showFilters = false;
    this.applyFilters(); // Apply the cleared filters
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  private getItemColor(item: any): string | null {
    if (!item) {
      return null;
    }
    const possibleKeys = ['color', 'Color', 'colour', 'itemColor', 'item_color'];
    for (const key of possibleKeys) {
      const value = item[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private applyClientSideItemFilters(items: any[]): any[] {
    const colorValue = this.searchForm?.get('colorFilter')?.value;
    if (!colorValue) {
      return items;
    }
    const normalized = colorValue.toLowerCase();
    return items.filter(item => {
      const itemColor = this.getItemColor(item);
      return itemColor ? itemColor.toLowerCase().includes(normalized) : false;
    });
  }

  openPopUp(data: any = {}, isNew?) {
    let title = isNew ? 
      `Add new ${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'}` : 
      `Update ${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'}`;
    
    // Responsive dialog configuration
    const isMobile = window.innerWidth <= 768;
    
    // Define responsive sizes per route
    const getDialogConfig = () => {
      if (isMobile) {
        // Mobile: Full screen for all routes
        return {
          width: '100vw',
          maxWidth: '100vw',
          height: '100vh',
          maxHeight: '100vh',
          panelClass: ['crud-dialog-container', 'mobile-dialog']
        };
      } else {
        // Desktop: Different sizes per route
        const config = {
          containers: { width: '90vw', maxWidth: '1200px', height: '90vh', maxHeight: '90vh' },
          items: { width: '95vw', maxWidth: '1000px', height: '95vh', maxHeight: '95vh' },
          suppliers: { width: '85vw', maxWidth: '1000px', height: '85vh', maxHeight: '85vh' },
          clients: { width: '90vw', maxWidth: '720px', height: 'auto', maxHeight: '90vh' }
        };
        
        const routeConfig = config[this.currentRoute] || config.clients;
        return {
          ...routeConfig,
          panelClass: ['crud-dialog-container', 'desktop-dialog']
        };
      }
    };
    
    const dialogConfig = getDialogConfig();
    
    let dialogRef: MatDialogRef<any> = this.dialog.open(NgxTablePopupComponent, {
      ...dialogConfig,
      disableClose: true,
      data: { title: title, payload: data, currentRoute: this.currentRoute }
    })
    dialogRef.afterClosed()
      .subscribe(res => {
        if(!res) {
          // If user press cancel
          return;
        }
        if (isNew) {
          this.loader.open(`Adding new ${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'}`);
          this.crudService.addItem(res, this.currentRoute)
            .subscribe({
              next: (response) => {
                // Handle paginated response for containers, items, clients, and suppliers
                if ((this.currentRoute === 'containers' || this.currentRoute === 'items' || this.currentRoute === 'clients' || this.currentRoute === 'suppliers') && response && typeof response === 'object' && response.data) {
                  this.totalElements = response.totalElements || 0;
                  this.totalPages = response.totalPages || 0;
                  this.currentPage = response.currentPage || 0;
                  
                  if (this.dataSource) {
                    this.dataSource.data = response.data;
                  } else {
                    this.dataSource = new MatTableDataSource(response.data);
                    this.setupTable();
                  }
                  
                  if (this.paginator) {
                    this.isUpdatingPagination = true;
                    
                    this.paginator.length = this.totalElements;
                    this.paginator.pageIndex = this.currentPage;
                    this.paginator.pageSize = response.pageSize || this.apiParams.pageSize;
                    
                    setTimeout(() => {
                      this.isUpdatingPagination = false;
                    }, 100);
                  }
                } else {
                  // Handle non-paginated response
                  this.dataSource = response;
                }
                this.loader.close();
                this.snack.open(`${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'} Added!`, 'OK', { duration: 4000 })
              },
              error: (error) => {
                this.loader.close();
                console.error('Error adding item:', error);
                this.snack.open(`Error adding ${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'}: ${error.message}`, 'OK', { duration: 4000 })
              }
            })
                } else {
                  this.loader.open(`Updating ${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'}`);
                  const id = data.id;
                  this.crudService.updateItem(id, res, this.currentRoute)
                    .subscribe({
                      next: (response) => {
                        // Handle paginated response for containers, items, clients, and suppliers
                        if ((this.currentRoute === 'containers' || this.currentRoute === 'items' || this.currentRoute === 'clients' || this.currentRoute === 'suppliers') && response && typeof response === 'object' && response.data) {
                          this.totalElements = response.totalElements || 0;
                          this.totalPages = response.totalPages || 0;
                          this.currentPage = response.currentPage || 0;
                          
                          if (this.dataSource) {
                            this.dataSource.data = response.data;
                          } else {
                            this.dataSource = new MatTableDataSource(response.data);
                            this.setupTable();
                          }
                          
                          if (this.paginator) {
                            this.isUpdatingPagination = true;
                            
                            this.paginator.length = this.totalElements;
                            this.paginator.pageIndex = this.currentPage;
                            this.paginator.pageSize = response.pageSize || this.apiParams.pageSize;
                            
                            setTimeout(() => {
                              this.isUpdatingPagination = false;
                            }, 100);
                          }
                        } else {
                          // Handle non-paginated response
                          this.dataSource = response;
                        }
                        this.loader.close();
                        this.snack.open(`${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'} Updated!`, 'OK', { duration: 4000 })
                      },
                      error: (error) => {
                        this.loader.close();
                        console.error('Error updating item:', error);
                        this.snack.open(`Error updating ${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'}: ${error.message}`, 'OK', { duration: 4000 })
                      }
                    })
                }
      })
  }
  
  // Open Stock Adjustment Dialog (Items Only)
  openStockAdjustment(item: any) {
    // Responsive dialog configuration
    const isMobile = window.innerWidth <= 768;
    
    const dialogRef = this.dialog.open(StockAdjustmentDialogComponent, {
      width: isMobile ? '100vw' : '90vw',
      maxWidth: isMobile ? '100vw' : '700px',
      height: isMobile ? '100vh' : 'auto',
      maxHeight: isMobile ? '100vh' : '95vh',
      panelClass: ['stock-adjustment-dialog-container', isMobile ? 'mobile-dialog' : 'desktop-dialog'],
      data: { item },
      disableClose: false,
      autoFocus: true,
      restoreFocus: true
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snack.open('Stock adjusted successfully', 'OK', { duration: 4000 });
        this.getItems(); // Refresh the table
      }
    });
  }
  
  deleteItem(row) {
    this.confirmService.confirm({message: `Delete ${row.name}?`})
      .subscribe(res => {
        if (res) {
          this.loader.open(`Deleting ${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'}`);
          this.crudService.removeItem(row, this.currentRoute)
            .subscribe({
              next: (response) => {
                // Handle paginated response for containers, items, clients, and suppliers
                if ((this.currentRoute === 'containers' || this.currentRoute === 'items' || this.currentRoute === 'clients' || this.currentRoute === 'suppliers') && response && typeof response === 'object' && response.data) {
                  this.totalElements = response.totalElements || 0;
                  this.totalPages = response.totalPages || 0;
                  this.currentPage = response.currentPage || 0;
                  
                  if (this.dataSource) {
                    this.dataSource.data = response.data;
                  } else {
                    this.dataSource = new MatTableDataSource(response.data);
                    this.setupTable();
                  }
                  
                  if (this.paginator) {
                    this.isUpdatingPagination = true;
                    
                    this.paginator.length = this.totalElements;
                    this.paginator.pageIndex = this.currentPage;
                    this.paginator.pageSize = response.pageSize || this.apiParams.pageSize;
                    
                    setTimeout(() => {
                      this.isUpdatingPagination = false;
                    }, 100);
                  }
                } else {
                  // Handle non-paginated response
                  this.dataSource = response;
                }
                this.loader.close();
                this.snack.open(`${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'} deleted!`, 'OK', { duration: 4000 })
              },
              error: (error) => {
                this.loader.close();
                console.error('Error deleting item:', error);
                this.snack.open(`Error deleting ${this.currentRoute === 'containers' ? 'Container' : this.currentRoute === 'items' ? 'Item' : this.currentRoute === 'clients' ? 'Client' : this.currentRoute === 'suppliers' ? 'Supplier' : 'Customer'}: ${error.message}`, 'OK', { duration: 4000 })
              }
            })
        }
      })
  }

  openImagePreview(imageSrc: string, itemName: string) {
    // Create a simple image preview dialog
    const dialogRef = this.dialog.open(ImagePreviewDialogComponent, {
      width: '80vw',
      maxWidth: '800px',
      height: '80vh',
      maxHeight: '600px',
      data: { imageSrc, itemName }
    });
  }
}