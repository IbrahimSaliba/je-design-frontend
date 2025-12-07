import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, delay, of, map, catchError, throwError } from 'rxjs';
import { Invoice } from 'app/shared/models/invoice.model';
import { JwtAuthService } from '../../shared/services/auth/jwt-auth.service';

@Injectable({
  providedIn: 'root'
})

export class InvoiceService {

  constructor(
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) { }

  // Helper method to get authorization headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtAuth.getJwtToken();
    
    if (!this.jwtAuth.isLoggedIn()) {
      console.warn('User is not logged in, redirecting to login...');
      window.location.href = '/sessions/signin';
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
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

  // Get invoices with pagination and filtering (frontend filtering for now)
  getInvoicesWithPagination(params: any): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.get('http://localhost:8080/api/invoices', { headers })
      .pipe(
        delay(100),
        map((response: any) => {
          console.log('Backend response:', response);
          
          // Handle direct array response (new endpoint format)
          if (Array.isArray(response)) {
            let invoices = response;
            
            // Apply frontend filtering
            invoices = this.applyFilters(invoices, params);
            
            // Apply pagination
            const totalElements = invoices.length;
            const pageSize = params.pageSize || 10;
            const currentPage = params.page || 0;
            const totalPages = Math.ceil(totalElements / pageSize);
            
            const startIndex = currentPage * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedData = invoices.slice(startIndex, endIndex);
            
            return {
              data: paginatedData,
              totalElements: totalElements,
              totalPages: totalPages,
              currentPage: currentPage,
              pageSize: pageSize
            };
          }
          // Handle wrapped response format (legacy)
          else if (response.errorCode === "000000" && response.responseData) {
            let invoices = response.responseData;
            
            // Apply frontend filtering
            invoices = this.applyFilters(invoices, params);
            
            // Apply pagination
            const totalElements = invoices.length;
            const pageSize = params.pageSize || 10;
            const currentPage = params.page || 0;
            const totalPages = Math.ceil(totalElements / pageSize);
            
            const startIndex = currentPage * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedData = invoices.slice(startIndex, endIndex);
            
            return {
              data: paginatedData,
              totalElements: totalElements,
              totalPages: totalPages,
              currentPage: currentPage,
              pageSize: pageSize
            };
          } else {
            console.error('API Error:', response.errorDescription || response);
            return {
              data: [],
              totalElements: 0,
              totalPages: 0,
              currentPage: 0,
              pageSize: params.pageSize || 10
            };
          }
        }),
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty array if backend fails (mock data removed)
          let invoices = [];
          invoices = this.applyFilters(invoices, params);
          
          const totalElements = invoices.length;
          const pageSize = params.pageSize || 10;
          const currentPage = params.page || 0;
          const totalPages = Math.ceil(totalElements / pageSize);
          
          const startIndex = currentPage * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = invoices.slice(startIndex, endIndex);
          
          return of({
            data: paginatedData,
            totalElements: totalElements,
            totalPages: totalPages,
            currentPage: currentPage,
            pageSize: pageSize
          });
        })
      );
  }

  // Apply filters on frontend
  private applyFilters(invoices: any[], params: any): any[] {
    let filteredInvoices = [...invoices];

    // Search filter - search in invoice number, client name, or created by name
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim().toLowerCase();
      filteredInvoices = filteredInvoices.filter(invoice =>
        (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm)) ||
        (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTerm)) ||
        (invoice.createdByName && invoice.createdByName.toLowerCase().includes(searchTerm))
      );
    }

    // Status filter
    if (params.status && params.status.trim()) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.status === params.status
      );
    }

    // Date range filter
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      filteredInvoices = filteredInvoices.filter(invoice => {
        if (!invoice.invoiceDate) return false;
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate >= fromDate;
      });
    }

    if (params.dateTo) {
      const toDate = new Date(params.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredInvoices = filteredInvoices.filter(invoice => {
        if (!invoice.invoiceDate) return false;
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate <= toDate;
      });
    }

    // Sorting
    if (params.sortBy === 'Descending') {
      filteredInvoices.sort((a, b) => {
        const dateA = new Date(a.invoiceDate || 0);
        const dateB = new Date(b.invoiceDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
    } else {
      filteredInvoices.sort((a, b) => {
        const dateA = new Date(a.invoiceDate || 0);
        const dateB = new Date(b.invoiceDate || 0);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return filteredInvoices;
  }

  // Get all invoices (for backward compatibility)
  getInvoiceList(dataType: string = 'default'): Observable<Invoice[]> {
    // Always use backend API - mock data removed
    return this.getAllInvoices();
  }

  // Get all invoices from backend
  getAllInvoices(): Observable<Invoice[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get('http://localhost:8080/api/invoices', { headers })
      .pipe(
        delay(100),
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            return response.responseData;
          } else {
            console.error('API Error:', response.errorDescription);
            return [];
          }
        }),
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty array if backend fails (mock data removed)
          return of([]);
        })
      );
  }

  getInvoiceById(id): Observable<Invoice> {
    const headers = this.getAuthHeaders();
    
    return this.http.get(`http://localhost:8080/api/invoices/${id}`, { headers })
      .pipe(
        delay(100),
        map((response: any) => {
          console.log('Get invoice by ID response:', response);
          
          // Handle direct response (backend returns InvoiceResponseDTO directly)
          if (response && response.invoiceId) {
            // Map backend response to frontend Invoice model
            return this.mapBackendInvoiceToFrontend(response);
          } 
          // Handle wrapped response
          else if (response.errorCode === "000000" && response.responseData) {
            return this.mapBackendInvoiceToFrontend(response.responseData);
          } else {
            console.error('API Error:', response.errorDescription || response);
            return null;
          }
        }),
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return null if backend fails (mock data removed)
          return of(null);
        })
      );
  }
  
  // Map backend InvoiceResponseDTO to frontend Invoice model
  private mapBackendInvoiceToFrontend(backendInvoice: any): Invoice {
    return {
      id: backendInvoice.invoiceId,
      orderNo: backendInvoice.invoiceNumber,
      invoiceNumber: backendInvoice.invoiceNumber,
      status: backendInvoice.status,
      date: backendInvoice.invoiceDate,
      invoiceDate: backendInvoice.invoiceDate,
      clientId: backendInvoice.clientId,
      clientName: backendInvoice.clientName,
      discounts: backendInvoice.discountAmount || 0, // Discount amount in dollars
      vat: backendInvoice.vatPercentage || 0, // VAT percentage from backend
      deductFromStock: backendInvoice.deductFromStock || 'Y', // Stock deduction flag
      paymentMethod: backendInvoice.paymentMethod, // Payment method
      totalAmount: backendInvoice.totalAmount,
      totalAmountBeforeDiscount: backendInvoice.totalAmountBeforeDiscount,
      amountSettled: backendInvoice.amountSettled,
      remainingAmount: backendInvoice.remainingAmount,
      item: (backendInvoice.items || []).map((item: any) => ({
        itemId: item.itemId,
        name: item.itemName,
        price: item.unitPrice,
        unit: item.quantity,
        isFree: item.isFree,
        code: item.itemCode || ''
      }))
    };
  }
  
  saveInvoice(invoiceData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    
    const sourceItems = Array.isArray(invoiceData.item) && invoiceData.item.length > 0
      ? invoiceData.item
      : (Array.isArray(invoiceData.items) ? invoiceData.items : []);

    // Transform frontend invoice data to match backend DTO
    const invoiceDTO = {
      clientId: invoiceData.clientId,
      discountAmount: invoiceData.discountAmount ?? invoiceData.discounts ?? 0, // Discount in dollars, not percentage
      vatPercentage: invoiceData.vatPercentage ?? invoiceData.vat ?? 0, // VAT percentage
      initialPayment: invoiceData.initialPayment || 0,
      deductFromStock: invoiceData.deductFromStock || 'Y',
      paymentMethod: invoiceData.paymentMethod, // Payment method
      status: invoiceData.status || 'PENDING', // Invoice status: PENDING or PAID
      invoiceDate: invoiceData.invoiceDate
        ? new Date(invoiceData.invoiceDate).toISOString()
        : invoiceData.date
          ? new Date(invoiceData.date).toISOString()
          : new Date().toISOString(), // Include invoice date
      items: sourceItems.map((item: any) => ({
        itemId: item.itemId,
        quantity: item.unit ?? item.quantity ?? 1,
        unitPrice: item.price ?? item.unitPrice ?? 0,
        isFree: item.isFree || false
      }))
    };

    console.log('Saving invoice with data:', invoiceDTO);

    if (invoiceData.id) {
      // Update existing invoice
      console.log('Updating invoice:', invoiceData.id);
      return this.http.put(`http://localhost:8080/api/invoices/${invoiceData.id}`, invoiceDTO, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            console.log('Invoice update response:', response);
            if (response.errorCode === "000000") {
              return response.responseData || invoiceData;
            } else {
              throw new Error(response.errorDescription || 'Failed to update invoice');
            }
          }),
          catchError((error) => {
            console.error('Error updating invoice:', error);
            throw error;
          })
        );
    } else {
      // Create new invoice
      return this.http.post('http://localhost:8080/api/invoices', invoiceDTO, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            console.log('Invoice creation response:', response);
            if (response.errorCode === "000000") {
              // Return success with generated invoice number
              return {
                ...invoiceData,
                id: Date.now().toString(), // Temporary ID
                orderNo: 'INV-' + Date.now()
              };
            } else {
              throw new Error(response.errorDescription || 'Failed to create invoice');
            }
          }),
          catchError((error) => {
            console.error('Error creating invoice:', error);
            return throwError(() => error);
          })
        );
    }
  }

  deleteInvoice(id): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.post(`http://localhost:8080/api/invoices/delete?invoiceId=${id}`, {}, { headers })
      .pipe(
        delay(100),
        map((response: any) => {
          console.log('Delete response:', response);
          return response;
        }),
        catchError((error) => {
          console.error('Error deleting invoice:', error);
          // Fallback to mock success if backend fails
          console.log('Falling back to mock delete');
          return of(true);
        })
      );
  }

}
