import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';

// Components
import { InventoryMovementsComponent } from './enhanced-items.component';
import { ItemDetailsDialogComponent } from './item-details-dialog/item-details-dialog.component';
import { BulkOperationsDialogComponent } from './bulk-operations-dialog/bulk-operations-dialog.component';
import { CategoryManagerDialogComponent } from './category-manager-dialog/category-manager-dialog.component';

// Routes
import { EnhancedItemsRoutes } from './enhanced-items.routing';

@NgModule({
  declarations: [
    InventoryMovementsComponent,
    ItemDetailsDialogComponent,
    BulkOperationsDialogComponent,
    CategoryManagerDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    RouterModule.forChild(EnhancedItemsRoutes)
  ],
  providers: []
})
export class EnhancedItemsModule { }
