import { Routes } from '@angular/router';
import { StockAlertsComponent } from './stock-alerts.component';

export const StockAlertsRoutes: Routes = [
  {
    path: '',
    component: StockAlertsComponent,
    data: { title: 'Stock Alerts', breadcrumb: 'Stock Alerts' }
  }
];
