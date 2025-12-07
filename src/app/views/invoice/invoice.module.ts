import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceRoutingModule } from './invoice-routing.module';
import { InvoiceListComponent } from './invoice-list/invoice-list.component';
import { InvoiceService } from './invoice.service';
import { InvoiceDetailsComponent } from './invoice-details/invoice-details.component';
import { SettlementsComponent } from './settlements/settlements.component';
import { SettlementService } from './settlement.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedComponentsModule } from 'app/shared/components/shared-components.module';
import { commonMaterialModules, allMaterialModules } from 'app/shared/material-imports';
import { CrudService } from 'app/views/cruds/crud.service';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    InvoiceRoutingModule,
    ...commonMaterialModules,
    ...allMaterialModules,
    ReactiveFormsModule,
    FormsModule,
    SharedComponentsModule,
    TranslateModule,
  ],
  declarations: [InvoiceListComponent, InvoiceDetailsComponent, SettlementsComponent],
  providers: [InvoiceService, SettlementService, CrudService]
})

export class InvoiceModule { }
