import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
    selector: 'app-app-loader',
    templateUrl: './app-loader.component.html',
    styleUrls: ['./app-loader.component.css'],
    standalone: true,
    imports: [
      CommonModule,
      MatProgressSpinnerModule,
      MatDialogModule
    ]
})
export class AppLoaderComponent implements OnInit {
  title;
  message;
  constructor(public dialogRef: MatDialogRef<AppLoaderComponent>) {}

  ngOnInit() {
  }

}
