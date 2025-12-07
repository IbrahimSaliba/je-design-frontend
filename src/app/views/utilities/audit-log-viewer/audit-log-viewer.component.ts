import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AuditLogFilter, AuditLogMetadata, AuditLogRecord, AuditLogService } from 'app/shared/services/audit-log.service';
import { AuditLogDetailsDialogComponent } from './audit-log-viewer-details.dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatDialogModule
  ],
  templateUrl: './audit-log-viewer.component.html',
  styleUrls: ['./audit-log-viewer.component.scss']
})
export class AuditLogViewerComponent implements OnInit, AfterViewInit, OnDestroy {

  filterForm: FormGroup;
  displayedColumns: string[] = [
    'createdAt',
    'username',
    'userRole',
    'action',
    'resourceType',
    'httpMethod',
    'requestPath',
    'responseCode',
    'success',
    'correlationId',
    'details'
  ];
  dataSource = new MatTableDataSource<AuditLogRecord>([]);
  isLoading = false;
  metadata: AuditLogMetadata = { actions: [], resources: [], httpMethods: [], usernames: [] };
  totalElements = 0;
  pageSize = 25;
  pageSizeOptions = [10, 25, 50, 100];
  private destroy$ = new Subject<void>();
  currentFilter: AuditLogFilter = {
    page: 0,
    size: 25,
    sortBy: 'createdAt',
    sortDirection: 'DESC'
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private fb: FormBuilder,
    private auditLogService: AuditLogService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      username: [''],
      action: [''],
      success: [''],
      from: [null],
      to: [null]
    });
  }

  ngOnInit(): void {
    this.loadMetadata();
    this.loadLogs(true);
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
      this.sort.sortChange.pipe(takeUntil(this.destroy$)).subscribe((sort: Sort) => {
        this.currentFilter.sortBy = sort.active || 'createdAt';
        this.currentFilter.sortDirection = (sort.direction || 'desc').toUpperCase() as 'ASC' | 'DESC';
        this.currentFilter.page = 0;
        if (this.paginator) {
          this.paginator.firstPage();
        }
        this.loadLogs();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    this.currentFilter.page = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadLogs(true);
  }

  resetFilters(): void {
    this.filterForm.reset({
      username: '',
      action: '',
      success: '',
      from: null,
      to: null
    });
    this.currentFilter = {
      page: 0,
      size: this.pageSize,
      sortBy: this.currentFilter.sortBy,
      sortDirection: this.currentFilter.sortDirection
    };
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadLogs(true);
  }

  onPage(event: PageEvent): void {
    this.currentFilter.page = event.pageIndex;
    this.currentFilter.size = event.pageSize;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  openDetails(log: AuditLogRecord): void {
    this.dialog.open(AuditLogDetailsDialogComponent, {
      width: '720px',
      maxHeight: '80vh',
      data: log
    });
  }

  private loadMetadata(): void {
    this.auditLogService.getMetadata()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metadata) => {
          this.metadata = metadata;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load audit metadata', err);
          this.snackBar.open('Failed to load audit metadata', 'Dismiss', { duration: 4000 });
        }
      });
  }

  private loadLogs(resetFilterState = false): void {
    this.isLoading = true;
    const filterPayload = this.buildFilterPayload(resetFilterState);

    this.auditLogService.searchLogs(filterPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalElements = response.totalElements ?? 0;
          this.currentFilter.page = response.currentPage ?? this.currentFilter.page ?? 0;
          this.currentFilter.size = response.pageSize ?? this.currentFilter.size ?? this.pageSize;
          this.pageSize = response.pageSize ?? this.currentFilter.size ?? this.pageSize;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load audit logs', err);
          this.snackBar.open('Failed to load audit logs', 'Dismiss', { duration: 4000 });
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private buildFilterPayload(resetFilterState: boolean): AuditLogFilter {
    const formValue = this.filterForm.value;

    if (resetFilterState) {
      this.currentFilter.page = 0;
      this.currentFilter.size = this.pageSize;
    }

    const filter: AuditLogFilter = {
      username: this.normalize(formValue.username),
      action: this.normalize(formValue.action),
      success: this.parseSuccess(formValue.success),
      from: this.toIsoString(formValue.from),
      to: this.toIsoString(formValue.to),
      page: this.currentFilter.page,
      size: this.currentFilter.size,
      sortBy: this.currentFilter.sortBy,
      sortDirection: this.currentFilter.sortDirection
    };

    this.currentFilter = { ...filter };
    return filter;
  }

  private normalize(value: string | null | undefined): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const trimmed = value.toString().trim();
    return trimmed.length ? trimmed : undefined;
  }

  private parseSuccess(value: string | null | undefined): boolean | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return value === 'true';
  }

  private toIsoString(value: Date | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const iso = value instanceof Date ? value.toISOString() : new Date(value).toISOString();
    return iso;
  }
}

