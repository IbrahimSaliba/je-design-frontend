import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtAuthService } from '../../shared/services/auth/jwt-auth.service';

export interface InvoiceItemDTO {
  itemId: string;
  quantity: number;
  unitPrice: number;
  isFree?: boolean;
}

export interface InvoiceDTO {
  clientId: string;
  discountAmount: number; // Discount in dollars, not percentage
  initialPayment: number;
  deductFromStock?: string; // Y or N, defaults to Y
  paymentMethod?: string; // Payment method: money, card, cash
  items: InvoiceItemDTO[];
}

export interface InvoiceResponse {
  errorCode: string;
  errorDescription: string;
  responseData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly apiUrl = 'http://localhost:8080/api/invoices';

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

  createInvoice(invoiceData: InvoiceDTO): Observable<InvoiceResponse> {
    const headers = this.getAuthHeaders();
    console.log('📝 INVOICE: Creating invoice with data:', invoiceData);
    console.log('🔑 INVOICE: Authorization headers:', headers.get('Authorization'));
    
    return this.http.post<InvoiceResponse>(this.apiUrl, invoiceData, { headers });
  }

  getInvoiceById(invoiceId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/${invoiceId}`, { headers });
  }

  getInvoicesByUserAndClient(userId: number, clientId: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/search?userId=${userId}&clientId=${clientId}`, { headers });
  }
}

