import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule as MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule as MatChipsModule } from '@angular/material/chips';
import { MatDialogModule as MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule as MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule as MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule as MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule as MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule as MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SharedModule } from '../../shared/shared.module';
import { CrudNgxTableComponent } from './crud-ngx-table/crud-ngx-table.component';

import { CrudsRoutes } from './cruds.routing';
import { CrudService } from './crud.service';
import { NgxTablePopupComponent } from './crud-ngx-table/ngx-table-popup/ngx-table-popup.component';
import { StockAdjustmentDialogComponent } from './stock-adjustment-dialog/stock-adjustment-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule as MatTableModule } from '@angular/material/table';
import { MatPaginatorModule as MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatButtonModule,
    MatChipsModule,
    MatListModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    TranslateModule,
    NgxMatSelectSearchModule,
    SharedModule,
    RouterModule.forChild(CrudsRoutes)
  ],
  declarations: [CrudNgxTableComponent, NgxTablePopupComponent, StockAdjustmentDialogComponent],
  providers: [CrudService]
})
export class CrudsModule { }
