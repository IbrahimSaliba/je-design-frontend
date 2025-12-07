import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AccountingService, AccountingEntry } from '../accounting.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-accounting-entry',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule
  ],
  templateUrl: './accounting-entry.component.html',
  styleUrl: './accounting-entry.component.scss'
})
export class AccountingEntryComponent implements OnInit, OnDestroy {
  // Expose Math to template
  Math = Math;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Entries from backend
  allEntries: AccountingEntry[] = [];
  private subscription?: Subscription;

  constructor(private accountingService: AccountingService) {
    this.totalItems = this.allEntries.length;
  }

  ngOnInit(): void {
    // Fetch entries from backend
    this.subscription = this.accountingService.getEntries().subscribe({
      next: (entries) => {
        console.log('Fetched accounting entries:', entries);
        this.allEntries = entries;
        this.totalItems = entries.length;
      },
      error: (error) => {
        console.error('Error fetching accounting entries:', error);
        this.allEntries = [];
        this.totalItems = 0;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Pagination
  get paginatedEntries(): AccountingEntry[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.allEntries.slice(startIndex, endIndex);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
  }

  // Utility method for empty fields
  getDisplayValue(value: string | undefined | null): string {
    return value || '-';
  }

  // TrackBy function for performance
  trackByEntryId(index: number, entry: AccountingEntry): string {
    return entry.id;
  }

  // Format date for mobile display
  formatDateForMobile(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
