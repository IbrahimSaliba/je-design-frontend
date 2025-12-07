import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageLayoutsRoutingModule } from './page-layouts-routing.module';
import { LeftSidebarCardComponent } from './left-sidebar-card/left-sidebar-card.component';
import { SharedDirectivesModule } from 'app/shared/directives/shared-directives.module';
import { SharedComponentsModule } from 'app/shared/components/shared-components.module';
import { FullWidthCardComponent } from './full-width-card/full-width-card.component';
import { PerfectScrollbarModule } from 'app/shared/components/perfect-scrollbar';
import { RightSidebarCardComponent } from './right-sidebar-card/right-sidebar-card.component';
import { FullWidthCardTabComponent } from './full-width-card-tab/full-width-card-tab.component';
import { commonMaterialModules, allMaterialModules } from 'app/shared/material-imports';
@NgModule({
  declarations: [LeftSidebarCardComponent, FullWidthCardComponent, RightSidebarCardComponent, FullWidthCardTabComponent],
  imports: [
    ...commonMaterialModules,
    ...allMaterialModules,
    SharedDirectivesModule,
    SharedComponentsModule,
    CommonModule,
    PerfectScrollbarModule,
    PageLayoutsRoutingModule
  ]
})
export class PageLayoutsModule { }
