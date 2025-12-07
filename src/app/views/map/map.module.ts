import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { GoogleMapsModule } from '@angular/google-maps';
import { provideHttpClient, withInterceptorsFromDi, withJsonpSupport } from '@angular/common/http';

import { MapComponent } from './map.component';
import { MapRoutes } from "./map.routing";

@NgModule({ declarations: [MapComponent], imports: [CommonModule,
        MatCardModule,
        MatListModule,
        GoogleMapsModule,
        RouterModule.forChild(MapRoutes)], providers: [provideHttpClient(withInterceptorsFromDi(), withJsonpSupport())] })
export class AppMapModule { }
