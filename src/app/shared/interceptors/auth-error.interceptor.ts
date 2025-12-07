import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtAuthService } from '../services/auth/jwt-auth.service';
import { MatDialog } from '@angular/material/dialog';
import { SessionExpiredDialogComponent } from '../components/session-expired-dialog/session-expired-dialog.component';
import { LoadingOverlayService } from '../services/loading-overlay.service';

@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private jwtAuth: JwtAuthService,
    private dialog: MatDialog,
    private loadingOverlay: LoadingOverlayService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Check if the error is related to authentication
        if (this.isAuthError(error)) {
          this.handleAuthError();
        }
        return throwError(error);
      })
    );
  }

  private isAuthError(error: HttpErrorResponse): boolean {
    // Check for common authentication error scenarios
    return (
      error.status === 401 || // Unauthorized
      error.status === 403 || // Forbidden
      (error.status === 0 && error.error instanceof ProgressEvent) || // Network error with auth
      this.isTokenExpiredError(error)
    );
  }

  private isTokenExpiredError(error: HttpErrorResponse): boolean {
    // Check if the error message indicates token expiration
    const errorMessage = error.error?.message || error.message || '';
    return (
      errorMessage.toLowerCase().includes('token') && 
      (errorMessage.toLowerCase().includes('expired') || 
       errorMessage.toLowerCase().includes('invalid') ||
       errorMessage.toLowerCase().includes('unauthorized'))
    );
  }

  private handleAuthError(): void {
    // Show blocking loading overlay
    this.loadingOverlay.showSessionExpired('Session expired. Redirecting to sign in...');
    
    // Clear the current session
    this.jwtAuth.setUserAndToken(null, null, false);
    
    // Show session expired dialog
    const dialogRef = this.dialog.open(SessionExpiredDialogComponent, {
      width: '400px',
      disableClose: true, // Prevent closing by clicking outside
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
}
