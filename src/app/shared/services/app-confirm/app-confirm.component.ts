import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm',
  template: `<div class="p-4">
    <h1 class="text-lg pl-1 !mb-2">{{ data.title }}</h1>
    <div class="mb-4 pl-1" *ngIf="!!data.message">{{ data.message }}</div>
    <div class="!pb-2 w-full flex justify-end gap-2">
    <button
    type="button"
    mat-stroked-button
    (click)="dialogRef.close(false)">Cancel</button>
    <button
    type="button"
    mat-flat-button
    color="primary"
    (click)="dialogRef.close(true)">{{ data.confirmText || 'OK' }}</button>
  </div>`,
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ]
})
export class AppComfirmComponent {
  constructor(
    public dialogRef: MatDialogRef<AppComfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }
}