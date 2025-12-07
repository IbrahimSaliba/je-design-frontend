import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TypographyComponent } from './typography/typography.component';
import { ColorsComponent } from './colors/colors.component';
import { DistributionMapComponent } from './distribution-map/distribution-map.component';
import { UserRoleGuard } from 'app/shared/guards/user-role.guard';
import { UserRole } from 'app/shared/models/user-role.model';

const routes: Routes = [
  {
    path: 'color',
    component: ColorsComponent
  },
  {
    path: 'typography',
    component: TypographyComponent
  },
  {
    path: 'distributions',
    component: DistributionMapComponent
  },
  {
    path: 'audit-logs',
    loadComponent: () => import('./audit-log-viewer/audit-log-viewer.component').then(c => c.AuditLogViewerComponent),
    canActivate: [UserRoleGuard],
    data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UtilitiesRoutingModule { }
