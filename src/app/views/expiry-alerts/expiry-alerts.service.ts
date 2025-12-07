import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';

export interface ExpiryAlert {
  itemId: string;
  itemName: string;
  itemCode: string;
  itemType: string;
  picture: string;
  currentStock: number;
  unitPrice: number;
  totalValue: number;
  expiryDate: string;
  daysUntilExpiry: number;
  expiryStatus: string;
  priority: string;
  containerId: string;
  containerCode: string;
  containerName: string;
  recommendedAction: string;
  estimatedLoss: number;
  statusBadgeColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpiryStatistics {
  totalExpired: number;
  criticalExpiring: number;
  warningExpiring: number;
  expiredValue: number;
  criticalValue: number;
  totalAtRisk: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExpiryAlertService {

  private apiUrl = `${environment.apiURL}/api/expiry-alerts`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('JWT_TOKEN');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all expiry alerts
   */
  getAllExpiryAlerts(): Observable<ExpiryAlert[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.errorCode === '000000') {
          return response.responseData || [];
        }
        throw new Error(response.errorDescription || 'Failed to load expiry alerts');
      })
    );
  }

  /**
   * Get critical expiry alerts (expiring within 7 days or already expired)
   */
  getCriticalExpiryAlerts(): Observable<ExpiryAlert[]> {
    return this.http.get<any>(`${this.apiUrl}/critical`, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.errorCode === '000000') {
          return response.responseData || [];
        }
        throw new Error(response.errorDescription || 'Failed to load critical expiry alerts');
      })
    );
  }

  /**
   * Get already expired items
   */
  getExpiredItems(): Observable<ExpiryAlert[]> {
    return this.http.get<any>(`${this.apiUrl}/expired`, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.errorCode === '000000') {
          return response.responseData || [];
        }
        throw new Error(response.errorDescription || 'Failed to load expired items');
      })
    );
  }

  /**
   * Get expiry statistics
   */
  getExpiryStatistics(): Observable<ExpiryStatistics> {
    return this.http.get<any>(`${this.apiUrl}/statistics`, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.errorCode === '000000') {
          return response.responseData || {};
        }
        throw new Error(response.errorDescription || 'Failed to load expiry statistics');
      })
    );
  }
}

