import { Routes } from '@angular/router';
import { CrudNgxTableComponent } from './crud-ngx-table/crud-ngx-table.component';

export const CrudsRoutes: Routes = [
  { 
    path: 'containers', 
    component: CrudNgxTableComponent, 
    data: { title: 'Containers', breadcrumb: 'Containers' } 
  },
  { 
    path: 'items', 
    component: CrudNgxTableComponent, 
    data: { title: 'Items', breadcrumb: 'Items' } 
  },
  { 
    path: 'clients', 
    component: CrudNgxTableComponent, 
    data: { title: 'Clients', breadcrumb: 'Clients' } 
  },
  { 
    path: 'suppliers', 
    component: CrudNgxTableComponent, 
    data: { title: 'Suppliers', breadcrumb: 'Suppliers' } 
  }
];