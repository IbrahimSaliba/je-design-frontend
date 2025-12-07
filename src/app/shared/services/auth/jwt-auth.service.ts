import { Injectable } from "@angular/core";
import { LocalStoreService } from "../local-store.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router, ActivatedRoute } from "@angular/router";
import { map, catchError, delay, switchMap } from "rxjs/operators";
import { User } from "../../models/user.model";
import { of, BehaviorSubject, throwError } from "rxjs";
import { environment } from "environments/environment";

// ================= only for demo purpose ===========
const DEMO_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjhkNDc4MDc4NmM3MjE3MjBkYzU1NzMiLCJlbWFpbCI6InJhZmkuYm9ncmFAZ21haWwuY29tIiwicm9sZSI6IlNBIiwiYWN0aXZlIjp0cnVlLCJpYXQiOjE1ODc3MTc2NTgsImV4cCI6MTU4ODMyMjQ1OH0.dXw0ySun5ex98dOzTEk0lkmXJvxg3Qgz4ed";

const DEMO_USER: User = {
  id: "5b700c45639d2c0c54b354ba",
  displayName: "Bob Saliba",
  role: "SA",
};
// ================= you will get those data from server =======

@Injectable({
  providedIn: "root",
})
export class JwtAuthService {
  token;
  isAuthenticated: Boolean;
  user: User = {};
  user$ = (new BehaviorSubject<User>(this.user));
  signingIn: Boolean;
  return: string;
  JWT_TOKEN = "JWT_TOKEN";
  APP_USER = "EGRET_USER";

  constructor(
    private ls: LocalStoreService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams
      .subscribe(params => this.return = params['return'] || '/');
  }

  public signin(username, password) {
    this.signingIn = true;
    return this.http.post(`${environment.apiURL}/auth/login`, { username, password })
      .pipe(
        switchMap((res: any) => {
          // Handle backend response format
          if (res.errorCode === "000000") {
            const token = res.errorDescription; // Token is in errorDescription field
            
            // Fetch user profile with role information
            return this.fetchUserProfile(token).pipe(
              map((profile: User) => {
                this.setUserAndToken(token, profile, true);
                this.signingIn = false;
                return { token, user: profile };
              })
            );
          } else {
            throw new Error(res.errorDescription || 'Login failed');
          }
        }),
        catchError((error) => {
          this.signingIn = false;
          console.error('Login error:', error);
          return throwError(error);
        })
      );
  }

  private fetchUserProfile(token: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${environment.apiURL}/api/auth/profile`, { headers })
      .pipe(
        map((res: any) => {
          if (res.errorCode === "000000" && res.responseData) {
            const profile = res.responseData;
            const user: User = {
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
            return user;
          } else {
            throw new Error('Failed to fetch user profile');
          }
        }),
        catchError((error) => {
          console.error('Error fetching user profile:', error);
          
          // If it's a 401 or token is invalid, sign out the user
          if (error.status === 401 || error.status === 403 || 
              (error.error && error.error.errorCode === '000001')) {
            console.warn('Invalid or expired token detected. Signing out...');
            this.signout();
            return throwError(() => new Error('Invalid token'));
          }
          
          // Fallback to basic user data for other errors
          return of({
            displayName: 'User',
            role: 'ADMIN'
          } as User);
        })
      );
  }

  /*
    checkTokenIsValid is called inside constructor of
    shared/components/layouts/admin-layout/admin-layout.component.ts
  */
  public checkTokenIsValid() {
    const token = this.getJwtToken();
    
    // Check if token exists and is not expired
    if (!token || this.isTokenExpired(token)) {
      this.signout();
      return throwError('Token expired or invalid');
    }

    // Fetch actual user profile from backend
    return this.fetchUserProfile(token)
      .pipe(
        map((profile: User) => {
          this.setUserAndToken(token, profile, true);
          this.signingIn = false;
          return profile;
        }),
        catchError((error) => {
          console.error('Token validation failed:', error);
          this.signout();
          return throwError(error);
        })
      );
    
    /*
      The following code get user data and jwt token is assigned to
      Request header using token.interceptor
      This checks if the existing token is valid when app is reloaded
    */

    // return this.http.get(`${environment.apiURL}/api/users/profile`)
    //   .pipe(
    //     map((profile: User) => {
    //       this.setUserAndToken(this.getJwtToken(), profile, true);
    //       return profile;
    //     }),
    //     catchError((error) => {
    //       this.signout();
    //       return of(error);
    //     })
    //   );
  }

  public signout() {
    const token = this.getJwtToken();
    
    // Clear ALL local storage immediately to prevent stale tokens
    this.setUserAndToken(null, null, false);
    localStorage.clear(); // Nuclear option - clear everything
    sessionStorage.clear(); // Also clear session storage
    
    if (token) {
      // Call backend logout API to blacklist the token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      this.http.post(`${environment.apiURL}/auth/logout`, {}, { headers })
        .pipe(
          catchError((error) => {
            // Even if logout API fails, we already cleared local data
            console.error('Logout API error:', error);
            return of(null);
          })
        )
        .subscribe(() => {
          // Navigate to signin
          this.router.navigateByUrl("sessions/signin");
        });
    } else {
      // No token, just navigate
      this.router.navigateByUrl("sessions/signin");
    }
  }

  isLoggedIn(): Boolean {
    return !!this.getJwtToken();
  }

  getJwtToken() {
    return this.ls.getItem(this.JWT_TOKEN);
  }
  getUser() {
    return this.ls.getItem(this.APP_USER);
  }

  setUserAndToken(token: String, user: User, isAuthenticated: Boolean) {
    this.isAuthenticated = isAuthenticated;
    this.token = token;
    this.user = user;
    this.user$.next(user);
    this.ls.setItem(this.JWT_TOKEN, token);
    this.ls.setItem(this.APP_USER, user);
  }

  /**
   * Checks if a JWT token is expired by decoding it
   * @param token JWT token string
   * @returns boolean - true if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      // Decode JWT token (without verification - for client-side expiry check only)
      const payload = this.decodeJwtPayload(token);
      
      if (!payload || !payload.exp) {
        return true;
      }

      // Check if token is expired (with 1 minute buffer)
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      const bufferTime = 60; // 1 minute in seconds
      
      return currentTime >= (expirationTime - bufferTime);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return true;
    }
  }

  /**
   * Decodes JWT payload without verification
   * @param token JWT token string
   * @returns decoded payload object
   */
  private decodeJwtPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token format');
    }
  }
}
