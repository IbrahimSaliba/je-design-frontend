import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';

// Components
import { StockAlertsComponent } from './stock-alerts.component';
import { ReorderDialogComponent } from './reorder-dialog/reorder-dialog.component';
import { AlertDetailsDialogComponent } from './alert-details-dialog/alert-details-dialog.component';

// Routes
import { StockAlertsRoutes } from './stock-alerts.routing';

@NgModule({
  declarations: [
    StockAlertsComponent,
    ReorderDialogComponent,
    AlertDetailsDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    RouterModule.forChild(StockAlertsRoutes)
  ],
  providers: []
})
export class StockAlertsModule { }
