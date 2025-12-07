import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoadingOverlayService } from '../../services/loading-overlay.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-overlay" *ngIf="isLoading" [class.blocking]="isBlocking">
      <div class="loading-content">
        <div class="spinner-container">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
        <div class="message" *ngIf="message">{{ message }}</div>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-overlay.blocking {
      background-color: rgba(0, 0, 0, 0.8);
      pointer-events: all;
    }

    .loading-content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      min-width: 200px;
    }

    .spinner-container {
      margin-bottom: 20px;
    }

    .message {
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .loading-content {
        background: #424242;
        color: white;
      }
      
      .message {
        color: white;
      }
    }
  `]
})
export class LoadingOverlayComponent implements OnInit, OnDestroy {
  isLoading = false;
  message = '';
  isBlocking = false;

  private subscriptions: Subscription[] = [];

  constructor(private loadingOverlayService: LoadingOverlayService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.loadingOverlayService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    this.subscriptions.push(
      this.loadingOverlayService.message$.subscribe(message => {
        this.message = message;
      })
    );

    this.subscriptions.push(
      this.loadingOverlayService.isBlocking$.subscribe(blocking => {
        this.isBlocking = blocking;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
