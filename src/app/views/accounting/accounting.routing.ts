import { Routes } from '@angular/router';
import { AccountingDashboardComponent } from './accounting-dashboard/accounting-dashboard.component';
import { AccountingEntriesComponent } from './accounting-entries/accounting-entries.component';
import { AccountingEntryComponent } from './accounting-entry/accounting-entry.component';

export const AccountingRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: AccountingDashboardComponent,
    data: { title: 'Accounting Dashboard', breadcrumb: 'Dashboard' }
  },
  {
    path: 'expenses',
    component: AccountingEntriesComponent,
    data: { title: 'Expenses', breadcrumb: 'Expenses' }
  },
  {
    path: 'accounting-entry',
    component: AccountingEntryComponent,
    data: { title: 'Accounting Entry', breadcrumb: 'Accounting Entry' }
  }
];

