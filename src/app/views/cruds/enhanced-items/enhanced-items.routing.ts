import { Routes } from '@angular/router';
import { InventoryMovementsComponent } from './enhanced-items.component';

export const EnhancedItemsRoutes: Routes = [
  {
    path: '',
    component: InventoryMovementsComponent,
    data: { title: 'Inventory Movements', breadcrumb: 'Inventory Movements' }
  }
];
