import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgChartsModule } from 'ng2-charts';
import { RouterModule } from '@angular/router';
import { AccountingService, Invoice, Expense } from '../accounting.service';

interface DashboardRecentEntry {
  entryNumber: string;
  description: string;
  date: string;
  referenceDate?: string | null;
  referenceSource?: string | null;
  totalDebit?: number;
  totalCredit?: number;
  isPosted: boolean;
}

@Component({
  selector: 'app-accounting-dashboard',
  templateUrl: './accounting-dashboard.component.html',
  styleUrls: ['./accounting-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    NgChartsModule,
    RouterModule
  ]
})
export class AccountingDashboardComponent implements OnInit {

  // Dashboard metrics
  totalRevenue: number = 0;
  totalExpenses: number = 0;
  netIncome: number = 0;
  netIncomeChangePercent: number | null = null;
  netIncomeChangeLabel: string = '—';
  netIncomeTrendIcon: 'trending_up' | 'trending_down' | 'trending_flat' = 'trending_flat';

  // Quick stats
  totalInvoices: number = 0;
  pendingInvoices: number = 0;
  totalExpensesCount: number = 0;
  pendingExpenses: number = 0;

  // Charts
  revenueChartData: any = { labels: [], datasets: [] };
  isLoading: boolean = true;
  isError: boolean = false;

  // Recent activities
  recentEntries: DashboardRecentEntry[] = [];
  recentInvoices: Invoice[] = [];
  recentExpenses: Expense[] = [];

  // Chart options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Financial Overview'
      }
    }
  };

  constructor(private accountingService: AccountingService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.isError = false;
    console.log('🔄 DASHBOARD COMPONENT: Loading data...');
    
    // Load all dashboard data from backend in one call
    this.accountingService.getAccountingDashboard().subscribe({
      next: dashboard => {
        console.log('📊 DASHBOARD COMPONENT: Data received:', dashboard);
        
        // Financial Metrics (real data)
        this.totalRevenue = this.toNumber(dashboard.totalRevenue);
        this.totalExpenses = this.toNumber(dashboard.totalExpenses);
        this.netIncome = this.toNumber(dashboard.netIncome);

        // Quick Stats
        this.totalInvoices = dashboard.totalInvoices || 0;
        this.pendingInvoices = dashboard.pendingInvoices || 0;
        this.totalExpensesCount = dashboard.totalExpensesCount || 0;
        this.pendingExpenses = dashboard.pendingExpenses || 0;

        // Recent Activities
        this.recentEntries = dashboard.recentEntries || [];
        this.recentInvoices = dashboard.recentInvoices || [];
        this.recentExpenses = dashboard.recentExpenses || [];

        // Update charts with real data if available
        if (dashboard.monthlyData && dashboard.monthlyData.months.length > 0) {
          this.updateChartsWithRealData(dashboard.monthlyData);
        } else {
          this.revenueChartData = { labels: [], datasets: [] };
          this.resetNetIncomeChange();
        }

        this.isLoading = false;
        console.log('✅ DASHBOARD COMPONENT: Data loaded successfully');
      },
      error: error => {
        console.error('❌ DASHBOARD COMPONENT: Error loading data:', error);
        this.isError = true;
        this.isLoading = false;
      }
    });
  }

  retryLoad(): void {
    if (!this.isLoading) {
      this.loadDashboardData();
    }
  }

  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatCurrency(amount: any): string {
    const value = this.toNumber(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) {
      return '-';
    }

    const value = typeof date === 'string' ? date : date.toString();
    const parsed = new Date(value);

    if (isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString();
  }

  getEntryAmount(entry: DashboardRecentEntry): number {
    const debit = this.toNumber(entry.totalDebit);
    const credit = this.toNumber(entry.totalCredit);
    return debit > 0 ? debit : credit;
  }

  isCreditEntry(entry: DashboardRecentEntry): boolean {
    const credit = this.toNumber(entry.totalCredit);
    return credit > 0;
  }
  
  private updateChartsWithRealData(monthlyData: any): void {
    const revenueData = (monthlyData.revenue || []).map((value: any) => this.toNumber(value));
    const expenseData = (monthlyData.expenses || []).map((value: any) => this.toNumber(value));

    this.calculateNetIncomeChange(revenueData, expenseData);
    // Update revenue chart with real data
    this.revenueChartData = {
      labels: monthlyData.months,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }
      ]
    };
  }
  
  private toNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    if (typeof value === 'object' && 'value' in value) {
      // BigDecimal serialized as { value: ... }
      return this.toNumber((value as any).value);
    }
    
    return 0;
  }

  private calculateNetIncomeChange(revenue: number[], expenses: number[]): void {
    if (!revenue || !expenses || revenue.length < 2 || expenses.length < 2) {
      this.resetNetIncomeChange();
      return;
    }

    const lastIndex = Math.min(revenue.length, expenses.length) - 1;
    const currentNet = revenue[lastIndex] - expenses[lastIndex];
    const previousNet = revenue[lastIndex - 1] - expenses[lastIndex - 1];

    if (previousNet === 0) {
      if (currentNet === 0) {
        this.netIncomeChangePercent = 0;
        this.netIncomeChangeLabel = '0%';
        this.netIncomeTrendIcon = 'trending_flat';
      } else {
        this.netIncomeChangePercent = null;
        this.netIncomeChangeLabel = 'N/A';
        this.netIncomeTrendIcon = currentNet > 0 ? 'trending_up' : 'trending_down';
      }
      return;
    }

    const change = ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
    this.netIncomeChangePercent = change;
    this.netIncomeChangeLabel = this.formatPercent(change);
    this.netIncomeTrendIcon = change > 0 ? 'trending_up' : change < 0 ? 'trending_down' : 'trending_flat';
  }

  private resetNetIncomeChange(): void {
    this.netIncomeChangePercent = null;
    this.netIncomeChangeLabel = '—';
    this.netIncomeTrendIcon = 'trending_flat';
  }

  formatPercent(value: number | null): string {
    if (value === null || !isFinite(value)) {
      return 'N/A';
    }
    const formatted = Math.abs(value) >= 1
      ? value.toFixed(1)
      : value.toFixed(2);
    const sign = value > 0 ? '+' : value < 0 ? '' : '';
    return `${sign}${formatted}%`;
  }

  getNetIncomeChangeClass(): string {
    if (this.netIncomeChangePercent === null) {
      return 'text-gray-500';
    }
    return this.netIncomeChangePercent >= 0 ? 'text-green-600' : 'text-red-600';
  }
}
