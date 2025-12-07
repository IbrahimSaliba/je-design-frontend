import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { interval, Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { JwtAuthService } from './auth/jwt-auth.service';
import { TokenValidationService } from './token-validation.service';
import { SessionExpiredDialogComponent } from '../components/session-expired-dialog/session-expired-dialog.component';
import { LoadingOverlayService } from './loading-overlay.service';

@Injectable({
  providedIn: 'root'
})
export class AuthMonitorService implements OnDestroy {
  private tokenCheckInterval: Subscription | null = null;
  private readonly CHECK_INTERVAL = 60000; // Check every minute
  private readonly WARNING_THRESHOLD = 300; // Warn 5 minutes before expiration

  constructor(
    private jwtAuth: JwtAuthService,
    private tokenValidation: TokenValidationService,
    private router: Router,
    private dialog: MatDialog,
    private loadingOverlay: LoadingOverlayService
  ) {
    this.startTokenMonitoring();
  }

  ngOnDestroy(): void {
    this.stopTokenMonitoring();
  }

  /**
   * Starts monitoring the JWT token for expiration
   */
  startTokenMonitoring(): void {
    if (this.tokenCheckInterval) {
      this.stopTokenMonitoring();
    }

    this.tokenCheckInterval = interval(this.CHECK_INTERVAL).pipe(
      switchMap(() => {
        // Check if user is authenticated
        if (!this.jwtAuth.isLoggedIn()) {
          return [];
        }

        // Check token expiration
        if (this.tokenValidation.isTokenExpired()) {
          this.handleTokenExpiration();
          return [];
        }

        // Check if token is close to expiration
        const timeUntilExpiration = this.tokenValidation.getTimeUntilExpiration();
        if (timeUntilExpiration <= this.WARNING_THRESHOLD && timeUntilExpiration > 0) {
          this.showTokenExpirationWarning(timeUntilExpiration);
        }

        return [];
      })
    ).subscribe();
  }

  /**
   * Stops monitoring the JWT token
   */
  stopTokenMonitoring(): void {
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
      this.tokenCheckInterval = null;
    }
  }

  /**
   * Handles token expiration by showing dialog and redirecting to signin
   */
  private handleTokenExpiration(): void {
    this.stopTokenMonitoring();
    
    // Show blocking loading overlay
    this.loadingOverlay.showSessionExpired('Session expired. Redirecting to sign in...');
    
    // Clear the current session
    this.jwtAuth.setUserAndToken(null, null, false);
    
    // Show session expired dialog
    const dialogRef = this.dialog.open(SessionExpiredDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        message: 'Your session has expired. Please sign in again to continue.'
      }
    });

    // Handle dialog result
    dialogRef.afterClosed().subscribe(() => {
      // Hide loading overlay
      this.loadingOverlay.hide();
      
      // Navigate to signin page
      this.router.navigate(['/sessions/signin'], {
        queryParams: {
          return: this.router.url
        }
      });
    });
  }

  /**
   * Shows a warning when token is close to expiration
   * @param timeUntilExpiration seconds until token expires
   */
  private showTokenExpirationWarning(timeUntilExpiration: number): void {
    const minutes = Math.ceil(timeUntilExpiration / 60);
    
    const dialogRef = this.dialog.open(SessionExpiredDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        message: `Your session will expire in ${minutes} minute${minutes > 1 ? 's' : ''}. Please save your work and sign in again to continue.`
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // User can continue working or choose to sign in again
    });
  }

  /**
   * Manually triggers token validation
   */
  validateTokenNow(): void {
    if (!this.jwtAuth.isLoggedIn()) {
      return;
    }

    this.tokenValidation.validateToken().subscribe(isValid => {
      if (!isValid) {
        this.handleTokenExpiration();
      }
    });
  }

  /**
   * Gets current token status information
   */
  getTokenStatus(): { isValid: boolean; expiresAt: string; timeUntilExpiration: number } {
    return {
      isValid: !this.tokenValidation.isTokenExpired(),
      expiresAt: this.tokenValidation.getTokenExpirationTime(),
      timeUntilExpiration: this.tokenValidation.getTimeUntilExpiration()
    };
  }
}
