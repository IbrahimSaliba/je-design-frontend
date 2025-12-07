import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// API Response Interfaces
export interface BackendResponse {
  errorCode: string;
  errorDescription: string;
  responseData?: any;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface OTPVerificationRequest {
  otp: number;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private baseUrl = (environment as any).apiUrl || (environment as any).apiURL || 'http://localhost:8080';
  private apiPrefix = '/api';

  constructor(private http: HttpClient) { }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.errorDescription) {
        errorMessage = error.error.errorDescription;
      }
    }
    console.error(error);
    return throwError(() => new Error(errorMessage));
  }

  login(credentials: LoginRequest): Observable<BackendResponse> {
    return this.http.post<BackendResponse>(`${this.baseUrl}${this.apiPrefix}/auth/login`, credentials)
      .pipe(catchError(this.handleError));
  }

  verifyOTP(otpRequest: OTPVerificationRequest): Observable<BackendResponse> {
    return this.http.post<BackendResponse>(`${this.baseUrl}${this.apiPrefix}/auth/OTPVerification`, otpRequest)
      .pipe(catchError(this.handleError));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}${this.apiPrefix}/auth/logout`, {})
      .pipe(catchError(this.handleError));
  }
}
