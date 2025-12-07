import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map, catchError, switchMap } from 'rxjs/operators';
import { JwtAuthService } from '../../shared/services/auth/jwt-auth.service';

@Injectable()
        export class CrudService {
          items: any[];
          containers: any[];
          clients: any[];
          suppliers: any[];
          constructor(
            private http: HttpClient,
            private jwtAuth: JwtAuthService
          ) {
            // No mock data initialization - using real API calls only
          }

  // Helper method to get authorization headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtAuth.getJwtToken();
    console.log('Token from JWT service:', token); // Debug log
    
    // Check if user is logged in
    if (!this.jwtAuth.isLoggedIn()) {
      console.warn('User is not logged in, redirecting to login...');
      // Redirect to login page
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

  //******* Implement your APIs ********
  getItems(dataType: string = 'default'): Observable<any> {
    // Use backend API for containers
    if (dataType === 'containers') {
      return this.getAllContainers();
    }
    
    // Use backend API for items
    if (dataType === 'items') {
      return this.getAllItems();
    }
    
    // Use backend API for clients
    if (dataType === 'clients') {
      return this.getAllClients();
    }
    
    // Use backend API for suppliers
    if (dataType === 'suppliers') {
      return this.getAllSuppliers();
    }
    
    let data;
    
    // Get data based on the data type
    switch(dataType) {
      case 'suppliers':
        data = this.suppliers.slice();
        break;
      default:
        data = this.items.slice();
        break;
    }
    
    return of(data);
  }

  getContainersWithFilters(params: any): Observable<any> {
    // Call the actual backend API
    return this.http.post('http://localhost:8080/api/containers/filter', params)
      .pipe(
        delay(100), // Small delay for UX
        // Transform the response to match frontend expectations
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            // If responseData has paginated structure
            if (response.responseData.data) {
              return response.responseData.data;
            }
            // If responseData is directly the array
            return response.responseData;
          } else {
            console.error('API Error:', response.errorDescription);
            return [];
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty array on error
          return of([]);
        })
      );
  }

  getContainersWithPagination(params: any): Observable<any> {
    // Call the actual backend API and return full paginated response
    return this.http.post('http://localhost:8080/api/containers/filter', params)
      .pipe(
        delay(100), // Small delay for UX
        // Return the full response for pagination metadata
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            return response.responseData; // Return full paginated response
          } else {
            console.error('API Error:', response.errorDescription);
            return {
              data: [],
              totalElements: 0,
              totalPages: 0,
              currentPage: 0,
              pageSize: params.pageSize || 10
            };
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty paginated response on error
          return of({
            data: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            pageSize: params.pageSize || 10
          });
        })
      );
  }

  getAllContainers(): Observable<any> {
    // Call the backend API to get all containers
    return this.http.get('http://localhost:8080/api/containers')
      .pipe(
        delay(100), // Small delay for UX
        // Transform the response to match frontend expectations
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            return response.responseData;
          } else {
            console.error('API Error:', response.errorDescription);
            return [];
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty array on error
          return of([]);
        })
      );
  }

  searchContainers(searchTerm: string, pageSize: number = 20): Observable<any[]> {
    const payload = {
      page: 0,
      pageSize: pageSize,
      sortBy: 'Descending',
      search: searchTerm || ''
    };

    return this.getContainersWithFilters(payload);
  }

  getContainerById(containerId: number): Observable<any | null> {
    return this.http.get(`http://localhost:8080/api/containers/${containerId}`)
      .pipe(
        delay(100),
        map((response: any) => {
          if (response && response.errorCode === '000000') {
            return response.responseData;
          }
          console.error('API Error:', response?.errorDescription);
          return null;
        }),
        catchError((error) => {
          console.error('HTTP Error:', error);
          return of(null);
        })
      );
  }

  getInventoryStatistics(): Observable<any> {
    return this.http.get('http://localhost:8080/api/inventory/statistics')
      .pipe(
        delay(100),
        catchError(error => {
          console.error('HTTP Error:', error);
          return of(null);
        })
      );
  }

  getInventoryMovements(): Observable<any[]> {
    return this.http.get('http://localhost:8080/api/inventory')
      .pipe(
        delay(100),
        map((response: any) => Array.isArray(response) ? response : []),
        catchError(error => {
          console.error('HTTP Error:', error);
          return of([]);
        })
      );
  }

  getLowStockReport(): Observable<any[]> {
    return this.http.get('http://localhost:8080/api/inventory/low-stock')
      .pipe(
        delay(100),
        map((response: any) => Array.isArray(response) ? response : []),
        catchError(error => {
          console.error('HTTP Error:', error);
          return of([]);
        })
      );
  }

  getItemsWithPagination(params: any): Observable<any> {
    // Call the actual backend API and return full paginated response
    return this.http.post('http://localhost:8080/api/items/filter', params)
      .pipe(
        delay(100), // Small delay for UX
        // Return the full response for pagination metadata
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            return response.responseData; // Return full paginated response
          } else {
            console.error('API Error:', response.errorDescription);
            return {
              data: [],
              totalElements: 0,
              totalPages: 0,
              currentPage: 0,
              pageSize: params.pageSize || 10
            };
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty paginated response on error
          return of({
            data: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            pageSize: params.pageSize || 10
          });
        })
      );
  }

  getAllItems(): Observable<any> {
    // Call the backend API to get all items
    return this.http.get('http://localhost:8080/api/items')
      .pipe(
        delay(100), // Small delay for UX
        // Transform the response to match frontend expectations
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            return response.responseData;
          } else {
            console.error('API Error:', response.errorDescription);
            return [];
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty array on error
          return of([]);
        })
      );
  }

  getClientsWithPagination(params: any): Observable<any> {
    // Call the actual backend API and return full paginated response
    return this.http.post('http://localhost:8080/api/clients/filter', params)
      .pipe(
        delay(100), // Small delay for UX
        // Return the full response for pagination metadata
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            return response.responseData; // Return full paginated response
          } else {
            console.error('API Error:', response.errorDescription);
            return {
              data: [],
              totalElements: 0,
              totalPages: 0,
              currentPage: 0,
              pageSize: params.pageSize || 10
            };
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty paginated response on error
          return of({
            data: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            pageSize: params.pageSize || 10
          });
        })
      );
  }

  getAllClients(): Observable<any> {
    // Call the backend API to get all clients
    return this.http.get('http://localhost:8080/api/clients')
      .pipe(
        delay(100), // Small delay for UX
        map((response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            return response.responseData; // Return list of clients
          } else {
            console.error('API Error:', response.errorDescription);
            return [];
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty array on error
          return of([]);
        })
      );
  }

  getSuppliersWithPagination(params: any): Observable<any> {
    // Call the backend API to get all suppliers and handle pagination on frontend
    return this.http.get('http://localhost:8080/api/suppliers')
      .pipe(
        delay(100), // Small delay for UX
        // Handle pagination on frontend since backend doesn't return metadata
        map((response: any) => {
          if (Array.isArray(response)) {
            // Filter out deleted suppliers first
            let filteredData = response.filter((supplier: any) => 
              supplier.status !== 'DELETED'
            );
            
            // Apply search filter on frontend
            if (params.search && params.search.trim()) {
              const searchTerm = params.search.trim().toLowerCase();
              filteredData = filteredData.filter((supplier: any) => 
                (supplier.name && supplier.name.toLowerCase().includes(searchTerm)) ||
                (supplier.code && supplier.code.toLowerCase().includes(searchTerm))
              );
            }
            
            // Apply status filter on frontend
            if (params.status && params.status.trim()) {
              filteredData = filteredData.filter((supplier: any) => 
                supplier.status === params.status
              );
            }
            
            // Apply sorting
            if (params.sortBy === 'Descending') {
              filteredData.sort((a: any, b: any) => (b.name || '').localeCompare(a.name || ''));
            } else {
              filteredData.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
            }
            
            // Calculate pagination metadata
            const totalElements = filteredData.length;
            const pageSize = params.pageSize || 10;
            const currentPage = params.page || 0;
            const totalPages = Math.ceil(totalElements / pageSize);
            
            // Apply pagination
            const startIndex = currentPage * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedData = filteredData.slice(startIndex, endIndex);
            
            return {
              data: paginatedData,
              totalElements: totalElements,
              totalPages: totalPages,
              currentPage: currentPage,
              pageSize: pageSize
            };
          } else {
            console.error('Unexpected response format:', response);
            return {
              data: [],
              totalElements: 0,
              totalPages: 0,
              currentPage: 0,
              pageSize: params.pageSize || 10
            };
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty paginated response on error
          return of({
            data: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            pageSize: params.pageSize || 10
          });
        })
      );
  }

  getAllSuppliers(): Observable<any> {
    // Call the backend API to get all suppliers
    return this.http.get('http://localhost:8080/api/suppliers')
      .pipe(
        delay(100), // Small delay for UX
        map((response: any) => {
          if (Array.isArray(response)) {
            // Filter out deleted suppliers
            return response.filter((supplier: any) => 
              supplier.status !== 'DELETED'
            );
          } else {
            console.error('Unexpected response format:', response);
            return [];
          }
        }),
        // Handle errors gracefully
        catchError((error) => {
          console.error('HTTP Error:', error);
          // Return empty array on error
          return of([]);
        })
      );
  }

  getItemsWithFilters(route: string, params: any): Observable<any> {
    // Use backend API for containers
    if (route === 'containers') {
      return this.getContainersWithPagination(params);
    }
    
    // Use backend API for items
    if (route === 'items') {
      const { colorFilter, ...rest } = params || {};
      const itemParams: any = { ...rest };
      if (colorFilter && typeof colorFilter === 'string' && colorFilter.trim()) {
        itemParams.color = colorFilter.trim();
      }
      return this.getItemsWithPagination(itemParams);
    }
    
    // Use backend API for clients
    if (route === 'clients') {
      return this.getClientsWithPagination(params);
    }
    
    // Use backend API for suppliers
    if (route === 'suppliers') {
      // Map search parameter to match backend expectations
      const supplierParams = {
        ...params,
        search: params.search || ''
      };
      return this.getSuppliersWithPagination(supplierParams);
    }
    
    let data: any[] = [];
    
    // Get the appropriate data based on route
    switch(route) {
      case 'clients':
        data = this.clients.slice();
        break;
      case 'suppliers':
        data = this.suppliers.slice();
        break;
      default:
        data = this.items.slice();
    }
    
    // Apply search filter
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim().toUpperCase();
      data = data.filter(item => {
        switch(route) {
          case 'containers':
            return item.code && item.code.toUpperCase().includes(searchTerm);
          case 'items':
            return item.code && item.code.toUpperCase().includes(searchTerm);
          case 'clients':
            return item.name && item.name.toUpperCase().includes(searchTerm);
          case 'suppliers':
            return item.name && item.name.toUpperCase().includes(searchTerm);
          default:
            return item.name && item.name.toUpperCase().includes(searchTerm);
        }
      });
    }
    
    // Apply price filters for items
    if (route === 'items') {
      if (params.minPrice) {
        data = data.filter(item => item.final_price >= params.minPrice);
      }
      if (params.maxPrice) {
        data = data.filter(item => item.final_price <= params.maxPrice);
      }
    }
    
    // Apply status filter for containers
    if (route === 'containers' && params.status) {
      data = data.filter(item => item.status === params.status);
    }
    
    // Apply sorting
    if (params.sortBy === 'Descending') {
      data = data.sort((a, b) => b.id - a.id);
    } else {
      data = data.sort((a, b) => a.id - b.id);
    }
    
    // Apply pagination
    const startIndex = params.page * params.pageSize;
    const endIndex = startIndex + params.pageSize;
    const paginatedData = data.slice(startIndex, endIndex);
    
    // Simulate API delay
    return of(paginatedData).pipe(delay(100));
  }
  addItem(item, dataType: string = 'default'): Observable<any> {
    // Use backend API for containers
    if (dataType === 'containers') {
      return this.http.post('http://localhost:8080/api/containers', item)
        .pipe(
          delay(100),
          map((response: any) => {
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getContainersWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for items
    if (dataType === 'items') {
      const headers = this.getAuthHeaders(); // Add Authorization header
      console.log('📦 CRUD SERVICE: Creating item with auth headers');
      
      return this.http.post('http://localhost:8080/api/items', item, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            console.log('✅ CRUD SERVICE: Item created successfully:', response);
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getItemsWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for clients
    if (dataType === 'clients') {
      const headers = this.getAuthHeaders();
      console.log('Making client creation request with headers:', headers); // Debug log
      
      return this.http.post('http://localhost:8080/api/clients', item, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getClientsWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for suppliers
    if (dataType === 'suppliers') {
      const headers = this.getAuthHeaders();
      return this.http.post('http://localhost:8080/api/suppliers', item, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            // Refresh the data by calling the filter API
            return this.getSuppliersWithPagination({
              page: 0,
              pageSize: 10,
              sortBy: 'Descending'
            });
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    switch(dataType) {
      case 'suppliers':
        item.id = this.suppliers.length + 1;
        this.suppliers.unshift(item);
        return of(this.suppliers.slice()).pipe(delay(1000));
      default:
        item._id = Math.round(Math.random() * 10000000000).toString();
        this.items.unshift(item);
        return of(this.items.slice()).pipe(delay(1000));
    }
  }
  
  updateItem(id, item, dataType: string = 'default') {
    // Use backend API for containers
    if (dataType === 'containers') {
      return this.http.put(`http://localhost:8080/api/containers/${id}`, item)
        .pipe(
          delay(100),
          map((response: any) => {
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getContainersWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for items
    if (dataType === 'items') {
      return this.http.put(`http://localhost:8080/api/items/${id}`, item)
        .pipe(
          delay(100),
          map((response: any) => {
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getItemsWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for clients
    if (dataType === 'clients') {
      const headers = this.getAuthHeaders();
      return this.http.put(`http://localhost:8080/api/clients/${id}`, item, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getClientsWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for suppliers
    if (dataType === 'suppliers') {
      const headers = this.getAuthHeaders();
      return this.http.put(`http://localhost:8080/api/suppliers/${id}`, item, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            // Refresh the data by calling the filter API
            return this.getSuppliersWithPagination({
              page: 0,
              pageSize: 10,
              sortBy: 'Descending'
            });
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    switch(dataType) {
      case 'suppliers':
        this.suppliers = this.suppliers.map(i => {
          if(i.id === id) {
            return Object.assign({}, i, item);
          }
          return i;
        });
        return of(this.suppliers.slice()).pipe(delay(1000));
      default:
        this.items = this.items.map(i => {
          if(i._id === id) {
            return Object.assign({}, i, item);
          }
          return i;
        });
        return of(this.items.slice()).pipe(delay(1000));
    }
  }
  
  removeItem(row, dataType: string = 'default') {
    // Use backend API for containers
    if (dataType === 'containers') {
      return this.http.delete(`http://localhost:8080/api/containers/${row.id}`)
        .pipe(
          delay(100),
          map((response: any) => {
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getContainersWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for items
    if (dataType === 'items') {
      return this.http.delete(`http://localhost:8080/api/items/${row.id}`)
        .pipe(
          delay(100),
          map((response: any) => {
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getItemsWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for clients
    if (dataType === 'clients') {
      const headers = this.getAuthHeaders();
      return this.http.delete(`http://localhost:8080/api/clients/${row.id}`, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            if (response.errorCode === "000000") {
              // Refresh the data by calling the filter API
              return this.getClientsWithPagination({
                page: 0,
                pageSize: 10,
                sortBy: 'Descending'
              });
            } else {
              console.error('API Error:', response.errorDescription);
              throw new Error(response.errorDescription);
            }
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    // Use backend API for suppliers
    if (dataType === 'suppliers') {
      const headers = this.getAuthHeaders();
      return this.http.delete(`http://localhost:8080/api/suppliers/${row.id}`, { headers })
        .pipe(
          delay(100),
          map((response: any) => {
            // Refresh the data by calling the filter API
            return this.getSuppliersWithPagination({
              page: 0,
              pageSize: 10,
              sortBy: 'Descending'
            });
          }),
          switchMap(filteredData => filteredData),
          catchError((error) => {
            console.error('HTTP Error:', error);
            throw error;
          })
        );
    }
    
    switch(dataType) {
      case 'suppliers':
        let supplierIndex = this.suppliers.findIndex(item => item.id === row.id);
        if (supplierIndex !== -1) {
          this.suppliers.splice(supplierIndex, 1);
        }
        return of(this.suppliers.slice()).pipe(delay(1000));
      default:
        let defaultIndex = this.items.indexOf(row);
        this.items.splice(defaultIndex, 1);
        return of(this.items.slice()).pipe(delay(1000));
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Stock Adjustment - The ONLY way to change item quantity
  adjustItemStock(itemId: string, adjustmentData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`http://localhost:8080/api/items/${itemId}/adjust-stock`, adjustmentData, { headers });
  }
}
