import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-preview-dialog',
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">{{data.itemName}}</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="text-gray-500 hover:text-gray-700">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="flex justify-center items-center">
        <img 
          [src]="data.imageSrc" 
          [alt]="data.itemName"
          class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          (error)="onImageError($event)"
        />
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class ImagePreviewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImagePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { imageSrc: string, itemName: string }
  ) {}

  onImageError(event: any) {
    event.target.src = 'assets/images/placeholder-image.png';
  }
}
