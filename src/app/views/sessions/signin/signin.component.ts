import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { JwtAuthService } from '../../../shared/services/auth/jwt-auth.service';
import { AppLoaderService } from '../../../shared/services/app-loader/app-loader.service';
import { egretAnimations } from 'app/shared/animations/egret-animations';

@Component({
    selector: 'app-signin',
    templateUrl: './signin.component.html',
    styleUrls: ['./signin.component.scss'],
    animations: egretAnimations,
    standalone: false
})
export class SigninComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;
  isLoading = false;

  signupForm: UntypedFormGroup;
  hidePassword = true;
  errorMsg = '';
  private _unsubscribeAll: Subject<any>;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jwtAuth: JwtAuthService,
    private egretLoader: AppLoaderService,
    private http: HttpClient
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, this.usernameOrEmailValidator]],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  // Custom validator for username or email
  private usernameOrEmailValidator(control: any) {
    if (!control.value) {
      return null;
    }
    
    const value = control.value.trim();
    
    // If it contains @, validate as email
    if (value.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : { email: true };
    }
    
    // Otherwise, validate as username (alphanumeric, underscore, hyphen, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(value) ? null : { username: true };
  }

  ngAfterViewInit() {
    // Uncomment if you want auto sign-in
    // this.autoSignIn();
  }

  ngOnDestroy() {
    this._unsubscribeAll.next(1);
    this._unsubscribeAll.complete();
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const signinData = this.signupForm.value;
      
      // Log the form data in the requested format
      console.log({
        "username": signinData.email,
        "password": signinData.password
      });
      
      this.submitButton.disabled = true;
      this.progressBar.mode = 'indeterminate';
      this.isLoading = true;
      this.errorMsg = '';
      
      // Make actual API call to backend
      this.callLoginApi(signinData.email, signinData.password);
    }
  }

  private callLoginApi(username: string, password: string) {
    const loginPayload = {
      username: username,
      password: password
    };

    this.http.post('http://localhost:8080/api/auth/login', loginPayload)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response: any) => {
          this.handleLoginResponse(response, username);
        },
        error: (error) => {
          console.error('Login API error:', error);
          this.handleLoginError(error);
        }
      });
  }

  private handleLoginError(error: any) {
    this.isLoading = false;
    this.submitButton.disabled = false;
    this.progressBar.mode = 'determinate';
    
    if (error.status === 401 || error.status === 403) {
      this.errorMsg = 'Invalid username or password';
    } else if (error.status === 0) {
      this.errorMsg = 'Unable to connect to server. Please check your connection.';
    } else {
      this.errorMsg = error.error?.errorDescription || error.message || 'An error occurred during login';
    }
  }

  private handleLoginResponse(response: any, username?: string) {
    this.isLoading = false;
    this.submitButton.disabled = false;
    this.progressBar.mode = 'determinate';

    if (response.errorCode === "000000") {
      if (response.errorDescription === "Success") {
        // 2FA is enabled - redirect to OTP page with username
        this.router.navigate(['/sessions/otp'], { 
          queryParams: { username: username } 
        });
      } else {
        // 2FA is disabled - JWT token received, login directly
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
      }
    } else if (response.errorCode === "000001") {
      // Bad credentials
      this.errorMsg = response.errorDescription || 'Invalid email or password';
    } else if (response.errorCode === "000004") {
      // Validation error - username/password empty
      this.errorMsg = response.errorDescription || 'Username and password are required';
    } else {
      // Other errors (999999, etc.)
      this.errorMsg = response.errorDescription || 'An error occurred during login';
    }
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

  autoSignIn() {
    if (this.jwtAuth.return === '/') {
      return;
    }
    this.egretLoader.open(`Automatically Signing you in! \n Return url: ${this.jwtAuth.return.substring(0, 20)}...`, {width: '320px'});
    setTimeout(() => {
      this.onSubmit();
      this.egretLoader.close();
    }, 2000);
  }
}
