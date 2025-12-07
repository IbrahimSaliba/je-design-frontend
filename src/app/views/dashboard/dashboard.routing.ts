import { Routes } from '@angular/router';

import { AnalyticsComponent } from './analytics/analytics.component';
import { CryptocurrencyComponent } from './cryptocurrency/cryptocurrency.component';
import { UserRoleGuard } from 'app/shared/guards/user-role.guard';
import { LearningManagementComponent } from './learning-management/learning-management.component';
import { AnalyticsAltComponent } from './analytics-alt/analytics-alt.component';
import { InventoryDashboardComponent } from './inventory-dashboard/inventory-dashboard.component';
import { config } from 'config';

export const DashboardRoutes: Routes = [
  {
    path: '',
    redirectTo: 'inventory',
    pathMatch: 'full'
  },
  {
    path: 'inventory',
    component: InventoryDashboardComponent,
    data: { title: 'Inventory Dashboard', breadcrumb: 'Inventory Dashboard' }
  },
  {
    path: 'learning-management',
    component: LearningManagementComponent,
    data: { title: 'Learning management', breadcrumb: 'Learning management', roles: config.authRoles.editor }
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    data: { title: 'Analytics', breadcrumb: 'Analytics' }
  },
  {
    path: 'analytics-alt',
    component: AnalyticsAltComponent,
    data: { title: 'Analytics Alternative', breadcrumb: 'Analytics Alternative' }
  },
  {
    path: 'crypto',
    component: CryptocurrencyComponent,
    data: { title: 'Cryptocurrency', breadcrumb: 'Cryptocurrency' }
  },
];
