import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { JwtAuthService } from 'app/shared/services/auth/jwt-auth.service';
import { egretAnimations } from 'app/shared/animations/egret-animations';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss'],
  animations: egretAnimations,
  standalone: false
})
export class OtpComponent implements OnInit, OnDestroy {
  otpForm: FormGroup;
  isLoading = false;
  errorMsg = '';
  username: string = '';
  private _unsubscribeAll: Subject<any>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jwtAuth: JwtAuthService,
    private http: HttpClient
  ) {
    this._unsubscribeAll = new Subject();
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]]
    });
  }

  ngOnInit() {
    // Get username from query parameters
    this.route.queryParams.subscribe(params => {
      this.username = params['username'] || '';
      if (!this.username) {
        // If no username, redirect back to signin
        this.router.navigate(['/sessions/signin']);
        return;
      }
    });

    // Auto-focus first input
    setTimeout(() => {
      const firstInput = document.getElementById('digit1') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  ngOnDestroy() {
    this._unsubscribeAll.next(1);
    this._unsubscribeAll.complete();
  }

  onInput(event: any, currentIndex: number) {
    const input = event.target;
    const value = input.value;

    // Only allow digits
    if (!/^\d$/.test(value) && value !== '') {
      input.value = '';
      return;
    }

    // Move to next input if digit entered
    if (value && currentIndex < 4) {
      const nextInput = document.getElementById(`digit${currentIndex + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Update form control
    this.otpForm.get(`digit${currentIndex}`)?.setValue(value);
  }

  onKeyDown(event: any, currentIndex: number) {
    // Handle backspace
    if (event.key === 'Backspace' && !event.target.value && currentIndex > 1) {
      const prevInput = document.getElementById(`digit${currentIndex - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  onSubmit() {
    if (this.otpForm.valid && this.username) {
      this.isLoading = true;
      this.errorMsg = '';

      const otp = Object.values(this.otpForm.value).join('');
      
      // Make actual API call to backend
      this.verifyOtp(otp);
    }
  }

  private verifyOtp(otp: string) {
    const otpPayload = {
      otp: parseInt(otp, 10),
      username: this.username
    };

    this.http.post('http://localhost:8080/api/auth/OTPVerification', otpPayload)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response: any) => {
          this.handleOtpResponse(response);
        },
        error: (error) => {
          console.error('OTP verification API error:', error);
          this.handleOtpError(error);
        }
      });
  }

  private handleOtpError(error: any) {
    this.isLoading = false;
    
    if (error.status === 0) {
      this.errorMsg = 'Unable to connect to server. Please check your connection.';
    } else {
      this.errorMsg = error.error?.errorDescription || error.message || 'An error occurred during OTP verification';
    }
    
    // Clear the form and focus first input
    this.clearFormAndFocus();
  }

  private handleOtpResponse(response: any) {
    this.isLoading = false;
    
    if (response.errorCode === "000000") {
      // OTP verified successfully - store JWT token using the JWT service
      const jwtToken = response.errorDescription;
      
      // IMPORTANT: Clear ALL old data first
      localStorage.clear();
      sessionStorage.clear();
      
      // Fetch the full user profile from the server
      const headers = { 'Authorization': `Bearer ${jwtToken}` };
      this.http.get<any>('http://localhost:8080/api/auth/profile', { headers })
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe({
          next: (profileResponse: any) => {
            if (profileResponse.errorCode === "000000" && profileResponse.responseData) {
              const profile = profileResponse.responseData;
              const user = {
                id: profile.id?.toString(),
                displayName: profile.displayName || profile.username,
                role: profile.roleName,
                roleId: profile.roleId,
                username: profile.username,
                email: profile.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                picture: profile.picture,
                bio: profile.bio,
                phone: profile.phone,
                address: profile.address
              };
              
              // Now set the user with complete profile data
              this.jwtAuth.setUserAndToken(jwtToken, user, true);
              
              // Navigate to dashboard
              this.router.navigate(['/dashboard/inventory']);
            } else {
              // Fallback to token-based user data
              this.jwtAuth.setUserAndToken(jwtToken, this.getUserFromToken(jwtToken), true);
              this.router.navigate(['/dashboard/inventory']);
            }
          },
          error: (error) => {
            console.error('Error fetching user profile:', error);
            // Fallback to token-based user data
            this.jwtAuth.setUserAndToken(jwtToken, this.getUserFromToken(jwtToken), true);
            this.router.navigate(['/dashboard/inventory']);
          }
        });
    } else if (response.errorCode === "000010") {
      // Invalid OTP
      this.errorMsg = response.errorDescription || 'Invalid OTP. Please try again.';
      this.clearFormAndFocus();
    } else if (response.errorCode === "000005") {
      // Invalid OTP request data (missing username)
      this.errorMsg = response.errorDescription || 'Invalid request. Please try logging in again.';
      this.clearFormAndFocus();
    } else if (response.errorCode === "000002") {
      // User not found
      this.errorMsg = response.errorDescription || 'User not found. Please try logging in again.';
      this.clearFormAndFocus();
    } else {
      // Other errors (999999, etc.)
      this.errorMsg = response.errorDescription || 'An error occurred during OTP verification. Please try again.';
      this.clearFormAndFocus();
    }
  }

  private clearFormAndFocus() {
    // Clear the form
    this.otpForm.reset();
    // Focus first input
    setTimeout(() => {
      const firstInput = document.getElementById('digit1') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  private getUserFromToken(token: string): any {
    try {
      // Decode JWT token to get user information
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || 'user-id',
        displayName: payload.sub || 'User',
        role: payload.role || 'USER',
        email: payload.email || 'user@example.com'
      };
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return {
        id: 'user-id',
        displayName: 'User',
        role: 'USER',
        email: 'user@example.com'
      };
    }
  }

  resendOtp() {
    if (!this.username) {
      this.errorMsg = 'Username not found. Please try logging in again.';
      return;
    }

    this.isLoading = true;
    this.errorMsg = '';

    const resendPayload = {
      username: this.username
    };

    this.http.post('http://localhost:8080/api/auth/resendOtp', resendPayload)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.errorCode === "000000") {
            // Success - show success message
            this.errorMsg = 'New OTP code sent successfully! Please check your email.';
            // Clear the form to let user enter new OTP
            this.clearFormAndFocus();
          } else {
            // Handle different error codes
            this.errorMsg = this.getResendErrorMessage(response.errorCode, response.errorDescription);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Resend OTP API error:', error);
          
          if (error.status === 0) {
            this.errorMsg = 'Unable to connect to server. Please check your connection.';
          } else {
            this.errorMsg = error.error?.errorDescription || error.message || 'Failed to resend OTP. Please try again.';
          }
        }
      });
  }

  private getResendErrorMessage(errorCode: string, errorDescription: string): string {
    switch (errorCode) {
      case "000005":
        return 'Invalid request. Please try logging in again.';
      case "000002":
        return 'User not found. Please try logging in again.';
      case "000009":
        return 'Two-factor authentication is not enabled for this user.';
      case "000007":
        return 'Failed to send OTP email. Please try again.';
      case "999999":
        return 'An unexpected error occurred. Please try again.';
      default:
        return errorDescription || 'Failed to resend OTP. Please try again.';
    }
  }
}
