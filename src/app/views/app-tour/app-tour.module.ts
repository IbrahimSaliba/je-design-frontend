import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule as MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AppTourComponent } from './app-tour.component';
import { TourRoutes } from './app-tour.routing';
import { SharedDirectivesModule } from 'app/shared/directives/shared-directives.module';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    SharedDirectivesModule,
    RouterModule.forChild(TourRoutes)
  ],
  declarations: [AppTourComponent]
})
export class AppTourModule { }
