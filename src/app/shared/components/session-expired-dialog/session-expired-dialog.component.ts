import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-expired-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressBarModule, MatIconModule],
  template: `
    <div class="session-expired-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Session Expired</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
        <div class="countdown-container" *ngIf="countdown > 0">
          <p class="countdown-text">Redirecting to sign in page in {{ countdown }} seconds...</p>
          <mat-progress-bar mode="determinate" [value]="progressValue"></mat-progress-bar>
        </div>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-raised-button color="primary" (click)="signInNow()">
          Sign In Now
        </button>
      </div>
    </div>
  `,
  styles: [`
    .session-expired-dialog {
      text-align: center;
      padding: 20px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .warning-icon {
      color: #f44336;
      font-size: 32px;
      margin-right: 10px;
    }
    
    .dialog-content {
      margin-bottom: 20px;
    }
    
    .countdown-container {
      margin-top: 20px;
    }
    
    .countdown-text {
      margin-bottom: 10px;
      color: #666;
    }
    
    .dialog-actions {
      justify-content: center;
    }
    
    h2 {
      margin: 0;
      color: #333;
    }
    
    p {
      color: #666;
      line-height: 1.5;
    }
  `]
})
export class SessionExpiredDialogComponent {
  countdown = 5;
  progressValue = 100;
  private countdownInterval: any;

  constructor(
    public dialogRef: MatDialogRef<SessionExpiredDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {
    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      this.progressValue = (this.countdown / 5) * 100;
      
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.dialogRef.close();
      }
    }, 1000);
  }

  signInNow(): void {
    clearInterval(this.countdownInterval);
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
