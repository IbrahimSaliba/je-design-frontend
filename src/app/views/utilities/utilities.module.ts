import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UtilitiesRoutingModule } from './utilities-routing.module';
import { TypographyComponent } from './typography/typography.component';
import { SharedDirectivesModule } from 'app/shared/directives/shared-directives.module';
import { ColorsComponent } from './colors/colors.component';
import { DistributionMapComponent } from './distribution-map/distribution-map.component';
import { commonMaterialModules, allMaterialModules } from 'app/shared/material-imports';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletMarkerClusterModule } from '@asymmetrik/ngx-leaflet-markercluster';

@NgModule({
  declarations: [
    TypographyComponent, 
    ColorsComponent,
    DistributionMapComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ...commonMaterialModules,
    ...allMaterialModules,
    SharedDirectivesModule,
    LeafletModule,
    LeafletMarkerClusterModule,
    UtilitiesRoutingModule
  ]
})
export class UtilitiesModule { }
