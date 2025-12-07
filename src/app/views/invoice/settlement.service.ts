import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { JwtAuthService } from '../../shared/services/auth/jwt-auth.service';

export interface Settlement {
  id?: string;
  invoiceId: string;
  invoiceNumber?: string;
  clientName?: string;
  settlementAmount: number;
  settlementDate: Date | string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  recordedByName?: string;
  invoiceTotalAmount?: number;
  invoiceAmountSettled?: number;
  invoiceRemainingAmount?: number;
  invoiceStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettlementService {
  private readonly apiUrl = 'http://localhost:8080/api/settlements';

  constructor(
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtAuth.getJwtToken();
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getAllSettlements(): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getSettlementsByInvoice(invoiceId: string): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(`${this.apiUrl}/invoice/${invoiceId}`, 
      { headers: this.getAuthHeaders() });
  }

  getSettlementById(settlementId: string): Observable<Settlement> {
    return this.http.get<Settlement>(`${this.apiUrl}/${settlementId}`, 
      { headers: this.getAuthHeaders() });
  }

  createSettlement(settlement: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl, settlement, { headers });
  }

  deleteSettlement(settlementId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${settlementId}`, { headers });
  }

  // Get unpaid/partially paid invoices
  getUnpaidInvoices(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>('http://localhost:8080/api/invoices', { headers })
      .pipe(
        map((invoices: any[]) => {
          // Filter for invoices that are not PAID or DELETED
          return invoices.filter(inv => 
            inv.status !== 'PAID' && 
            inv.status !== 'DELETED' &&
            (inv.remainingAmount || 0) > 0
          );
        })
      );
  }
}

