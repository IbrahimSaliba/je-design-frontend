import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AccountingService, AccountingEntry, Account, JournalEntry } from '../accounting.service';
import { NewEntryDialogComponent, NewEntryDialogData, NewEntryFormData } from './new-entry-dialog/new-entry-dialog.component';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-accounting-entries',
  templateUrl: './accounting-entries.component.html',
  styleUrls: ['./accounting-entries.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule
  ]
})
export class AccountingEntriesComponent implements OnInit {
  
  // Expose Math to template
  Math = Math;
  
  entries: AccountingEntry[] = [];
  accounts: Account[] = [];
  filteredEntries: AccountingEntry[] = [];
  expenseIdMap: Map<string, string> = new Map(); // Maps local entry ID to backend expense ID
  overdueCount: number = 0; // Count of overdue pending expenses
  
  // Filters
  searchTerm: string = '';
  statusFilter: string = 'ALL';
  dateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  
  // Loading states
  loading: boolean = false;
  
  // Table columns
  displayedColumns: string[] = [
    'entryNumber',
    'date',
    'description',
    'reference',
    'totalDebit',
    'totalCredit',
    'status',
    'actions'
  ];

  constructor(
    private accountingService: AccountingService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadOverdueExpenses();
  }

  private loadData(): void {
    this.loading = true;
    
    // Load expenses and convert them to AccountingEntry format for display
    this.accountingService.getExpenses().subscribe({
      next: (expenses) => {
        console.log('Loaded expenses:', expenses);
        
        // Convert expenses to AccountingEntry format
        this.entries = expenses.map(expense => {
          const entryId = `entry_${expense.id}`;
          this.expenseIdMap.set(entryId, expense.id); // Store mapping
          
          return {
            id: entryId,
            entryNumber: expense.expenseNumber,
            date: expense.date,
            description: expense.description,
            reference: 'Expense Entry',
            isPosted: expense.status === 'SETTLED',
            status: expense.status,
            totalDebit: 0,
            totalCredit: expense.totalAmount, // Expenses are credits (outgoing)
            createdBy: expense.createdBy,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
            entries: []
          };
        });
        
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.loading = false;
      }
    });

    // Load accounts
    this.accountingService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  private loadOverdueExpenses(): void {
    this.accountingService.getOverdueExpenses().subscribe({
      next: (overdueExpenses) => {
        this.overdueCount = overdueExpenses.length;
        console.log(`${this.overdueCount} overdue pending expenses found`);
      },
      error: (error) => {
        console.error('Error loading overdue expenses:', error);
      }
    });
  }

  private applyFilters(): void {
    let filtered = [...this.entries];

    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.entryNumber.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        entry.reference.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (this.statusFilter !== 'ALL') {
      if (this.statusFilter === 'SETTLED') {
        filtered = filtered.filter(entry => entry.status === 'SETTLED');
      } else if (this.statusFilter === 'PENDING') {
        filtered = filtered.filter(entry => entry.status === 'PENDING');
      }
    }

    // Date range filter
    if (this.dateRange.start) {
      filtered = filtered.filter(entry => new Date(entry.date) >= this.dateRange.start!);
    }
    if (this.dateRange.end) {
      filtered = filtered.filter(entry => new Date(entry.date) <= this.dateRange.end!);
    }

    this.filteredEntries = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onDateRangeChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.dateRange = { start: null, end: null };
    this.applyFilters();
  }

  // Pagination
  get paginatedEntries(): AccountingEntry[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredEntries.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
  }

  // Actions
  createEntry(): void {
    const dialogData: NewEntryDialogData = {
      type: 'OUTCOME', // Expenses are always outgoing
      hideTypeSelector: true, // Hide type selector since this is expenses-only
      hideStatusField: false // Show status field - user controls it
    };

    const dialogRef = this.dialog.open(NewEntryDialogComponent, {
      width: '95vw',
      maxWidth: '600px',
      maxHeight: '90vh',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('New entry created:', result);
        // TODO: Process the new entry data
        // You can add it to your entries array or call a service to save it
        this.handleNewEntry(result);
      }
    });
  }

  private handleNewEntry(entryData: NewEntryFormData): void {
    this.loading = true;
    
    // Create expense via API
    this.accountingService.createExpense({
      amount: entryData.amount,
      reason: entryData.reason,
      settlementDate: entryData.settlementDate,
      status: entryData.status // Include user-selected status
    }).subscribe({
      next: (response) => {
        console.log('Expense created successfully:', response);
        // Reload data to get the latest from backend
        this.loadData();
      },
      error: (error) => {
        console.error('Error creating expense:', error);
        alert('Failed to create expense. Please try again.');
        this.loading = false;
      }
    });
  }

  private handleUpdatedEntry(originalEntry: AccountingEntry, updatedData: NewEntryFormData): void {
    this.loading = true;
    
    // Get the backend expense ID from the map
    const expenseId = this.expenseIdMap.get(originalEntry.id);
    
    if (!expenseId) {
      console.error('Could not find expense ID for entry:', originalEntry.id);
      alert('Failed to update expense. Please refresh and try again.');
      this.loading = false;
      return;
    }
    
    // Update expense via API
    this.accountingService.updateExpense(expenseId, {
      amount: updatedData.amount,
      reason: updatedData.reason,
      settlementDate: updatedData.settlementDate,
      status: updatedData.status // Include user-selected status
    }).subscribe({
      next: (response) => {
        console.log('Expense updated successfully:', response);
        // Reload data to get the latest from backend
        this.loadData();
      },
      error: (error) => {
        console.error('Error updating expense:', error);
        alert('Failed to update expense. Please try again.');
        this.loading = false;
      }
    });
  }

  editEntry(entry: AccountingEntry): void {
    const dialogData: NewEntryDialogData = {
      type: 'OUTCOME', // Expenses are always outgoing
      mode: 'edit',
      entry: entry,
      hideTypeSelector: true, // Hide type selector since this is expenses-only
      hideStatusField: false // Show status field - user controls it
    };

    const dialogRef = this.dialog.open(NewEntryDialogComponent, {
      width: '95vw',
      maxWidth: '600px',
      maxHeight: '90vh',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Entry updated:', result);
        // TODO: Update the entry in the list
        this.handleUpdatedEntry(entry, result);
      }
    });
  }

  viewEntry(entry: AccountingEntry): void {
    const dialogData: NewEntryDialogData = {
      type: 'OUTCOME', // Expenses are always outgoing
      mode: 'view',
      entry: entry,
      hideTypeSelector: true, // Hide type selector since this is expenses-only
      hideStatusField: false // Show status field
    };

    const dialogRef = this.dialog.open(NewEntryDialogComponent, {
      width: '95vw',
      maxWidth: '600px',
      maxHeight: '90vh',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      // No action needed for view mode
    });
  }

  postEntry(entry: AccountingEntry): void {
    if (entry.isPosted) {
      return;
    }

    this.loading = true;
    this.accountingService.postEntry(entry.id, 'current-user').subscribe({
      next: (updatedEntry) => {
        const index = this.entries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
          this.entries[index] = updatedEntry;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error posting entry:', error);
        this.loading = false;
      }
    });
  }

  settleEntry(entry: AccountingEntry): void {
    if (entry.status === 'SETTLED') {
      alert('Expense is already settled');
      return;
    }

    if (confirm('Are you sure you want to settle this expense? This will create an accounting entry and mark it as paid.')) {
      const expenseId = this.expenseIdMap.get(entry.id);
      
      if (!expenseId) {
        console.error('Could not find expense ID for entry:', entry.id);
        alert('Failed to settle expense. Please refresh and try again.');
        return;
      }
      
      this.loading = true;
      
      this.accountingService.settleExpense(expenseId).subscribe({
        next: (response) => {
          console.log('Expense settled successfully:', response);
          alert('Expense settled successfully! Accounting entry has been created.');
          this.loadData();
          this.loadOverdueExpenses(); // Refresh overdue count
        },
        error: (error) => {
          console.error('Error settling expense:', error);
          const errorMessage = error.error?.errorDescription || 'Failed to settle expense. Please try again.';
          alert(errorMessage);
          this.loading = false;
        }
      });
    }
  }

  deleteEntry(entry: AccountingEntry): void {
    const isPending = entry.status === 'PENDING';
    const isSettled = entry.status === 'SETTLED';
    
    let confirmMessage = 'Are you sure you want to delete this expense?';
    if (isSettled) {
      confirmMessage = 'Are you sure you want to delete this SETTLED expense?\n\n' +
                       'A REVERSAL accounting entry will be created to maintain the audit trail.\n' +
                       'The original accounting entry will be preserved.\n\n' +
                       'This action cannot be undone.';
    } else if (isPending) {
      confirmMessage = 'Are you sure you want to delete this PENDING expense?';
    }

    if (confirm(confirmMessage)) {
      // Get the backend expense ID from the map
      const expenseId = this.expenseIdMap.get(entry.id);
      
      if (!expenseId) {
        console.error('Could not find expense ID for entry:', entry.id);
        alert('Failed to delete expense. Please refresh and try again.');
        return;
      }
      
      this.loading = true;
      
      // Call the delete endpoint
      this.accountingService.deleteExpense(expenseId).subscribe({
        next: (response) => {
          console.log('Expense deleted successfully:', response);
          
          // Show appropriate success message
          if (isSettled) {
            alert('Expense deleted successfully!\n\n' +
                  'A reversal accounting entry has been created to maintain proper accounting records.\n' +
                  'You can view the reversal entry in the Accounting Entries page.');
          } else {
            alert('Expense deleted successfully!');
          }
          
          // Reload data to get the latest from backend
          this.loadData();
          this.loadOverdueExpenses(); // Refresh overdue count
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
          const errorMessage = error.error?.errorDescription || 'Failed to delete expense. Please try again.';
          alert(errorMessage);
          this.loading = false;
        }
      });
    }
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusColor(status: boolean): string {
    return status ? 'text-green-600' : 'text-yellow-600';
  }

  getStatusBadgeColor(status: string): string {
    return status === 'SETTLED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }

  getStatusText(entry: AccountingEntry): string {
    return entry.status;
  }

  // Validation
  isEntryBalanced(entry: AccountingEntry): boolean {
    return Math.abs(entry.totalDebit - entry.totalCredit) < 0.01;
  }

  getBalanceStatus(entry: AccountingEntry): string {
    if (this.isEntryBalanced(entry)) {
      return 'text-green-600';
    }
    return 'text-red-600';
  }
}
