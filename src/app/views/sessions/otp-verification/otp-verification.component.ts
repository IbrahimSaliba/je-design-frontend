import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStateService } from '../../../shared/services/auth-state.service';
import { AuthApiService, BackendResponse } from '../../../shared/services/auth-api.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-otp-verification',
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.scss'],
  standalone: false
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  otpForm: FormGroup;
  loading = false;
  errorMessage = '';
  username: string = '';
  countdown: number = 60;
  canResend: boolean = false;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private fb: FormBuilder,
    private authStateService: AuthStateService,
    private authApiService: AuthApiService,
    private router: Router
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]] // 4-digit OTP
    });
  }

  ngOnInit() {
    const authState = this.authStateService.getPendingAuthState();
    if (authState && authState.username) {
      this.username = authState.username;
      this.startCountdown();
    } else {
      this.router.navigate(['/sessions/signin']); // Redirect if no pending auth state
    }
  }

  ngOnDestroy() {
    this._unsubscribeAll.next(1);
    this._unsubscribeAll.complete();
  }

  startCountdown() {
    this.countdown = 60;
    this.canResend = false;
    interval(1000)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          this.canResend = true;
          this._unsubscribeAll.next(1); // Stop the countdown
        }
      });
  }

  onSubmit(): void {
    if (this.otpForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const otp = parseInt(this.otpForm.value.otp, 10);
      const authState = this.authStateService.getPendingAuthState();

      if (!authState || !authState.username) {
        this.errorMessage = 'Authentication state missing. Please try logging in again.';
        this.loading = false;
        return;
      }

      this.authApiService.verifyOTP({ otp, username: authState.username }).subscribe({
        next: (response: BackendResponse) => {
          this.loading = false;
          if (response.errorCode === '000000') {
            const token = response.responseData?.token || response.errorDescription;
            if (token) {
              // Create user object
              const user = {
                id: 1,
                username: authState.username,
                email: authState.username + '@example.com',
                role: 'ADMIN'
              };
              
              this.authStateService.setAuthenticated(user, token);
              this.authStateService.clearPendingAuthState();
              this.router.navigate(['/dashboard/default']);
            } else {
              this.errorMessage = 'Authentication successful but no token received';
            }
          } else {
            this.errorMessage = this.getErrorMessage(response.errorCode);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'OTP verification failed. Please try again.';
        }
      });
    }
  }

  resendOtp(): void {
    if (!this.canResend) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const authState = this.authStateService.getPendingAuthState();

    if (!authState || !authState.username || !authState.password) {
      this.errorMessage = 'Authentication state missing. Please try logging in again.';
      this.loading = false;
      return;
    }

    // Re-trigger login to resend OTP
    this.authApiService.login({ username: authState.username, password: authState.password }).subscribe({
      next: (response: BackendResponse) => {
        this.loading = false;
        if (response.errorCode === '000000') {
          this.startCountdown(); // Restart countdown
          this.errorMessage = 'A new OTP has been sent to your email.';
        } else {
          this.errorMessage = this.getErrorMessage(response.errorCode);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Failed to resend OTP. Please try again.';
      }
    });
  }

  backToLogin(): void {
    this.authStateService.clearPendingAuthState();
    this.router.navigate(['/sessions/signin']);
  }

  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      '000001': 'Invalid credentials.',
      '000004': 'Username and password must not be empty.',
      '000010': 'Invalid OTP. Please try again.',
      '000005': 'Invalid OTP request data.',
      '999999': 'An unexpected error occurred. Please try again.'
    };
    return errorMessages[errorCode] || 'Verification failed. Please try again.';
  }
}

