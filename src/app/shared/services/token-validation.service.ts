import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { JwtAuthService } from './auth/jwt-auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenValidationService {

  constructor(
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) {}

  /**
   * Validates the current JWT token by making a request to a protected endpoint
   * @returns Observable<boolean> - true if token is valid, false if expired/invalid
   */
  validateToken(): Observable<boolean> {
    const token = this.jwtAuth.getJwtToken();
    
    if (!token) {
      return of(false);
    }

    // Make a request to a protected endpoint to validate the token
    return this.http.get('http://localhost:8080/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      map(() => true), // If request succeeds, token is valid
      catchError((error) => {
        // If request fails with auth error, token is invalid
        if (error.status === 401 || error.status === 403) {
          return of(false);
        }
        // For other errors, assume token is still valid
        return of(true);
      })
    );
  }

  /**
   * Checks if the JWT token is expired by decoding it (client-side check)
   * @returns boolean - true if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.jwtAuth.getJwtToken();
    
    if (!token) {
      return true;
    }

    try {
      // Decode JWT token (without verification - for client-side expiry check only)
      const payload = this.decodeJwtPayload(token);
      
      if (!payload || !payload.exp) {
        return true;
      }

      // Check if token is expired (with 5 minute buffer)
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      const bufferTime = 5 * 60; // 5 minutes in seconds
      
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

  /**
   * Gets token expiration time in a readable format
   * @returns string - formatted expiration time or 'Invalid token'
   */
  getTokenExpirationTime(): string {
    const token = this.jwtAuth.getJwtToken();
    
    if (!token) {
      return 'No token';
    }

    try {
      const payload = this.decodeJwtPayload(token);
      
      if (!payload || !payload.exp) {
        return 'Invalid token';
      }

      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate.toLocaleString();
    } catch (error) {
      return 'Invalid token';
    }
  }

  /**
   * Gets time remaining until token expiration
   * @returns number - seconds remaining until expiration
   */
  getTimeUntilExpiration(): number {
    const token = this.jwtAuth.getJwtToken();
    
    if (!token) {
      return 0;
    }

    try {
      const payload = this.decodeJwtPayload(token);
      
      if (!payload || !payload.exp) {
        return 0;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      
      return Math.max(0, expirationTime - currentTime);
    } catch (error) {
      return 0;
    }
  }
}
