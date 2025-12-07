import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLogRecord {
  id: number;
  createdAt: string;
  userId?: number;
  username?: string;
  userRole?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  httpMethod?: string;
  requestPath?: string;
  responseCode?: number;
  success: boolean;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPayload?: string;
  responsePayload?: string;
  errorMessage?: string;
}

export interface AuditLogFilter {
  username?: string;
  action?: string;
  resource?: string;
  success?: boolean | null;
  httpMethod?: string;
  requestPath?: string;
  correlationId?: string;
  from?: string | null;
  to?: string | null;
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface AuditLogSearchResponse {
  data: AuditLogRecord[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AuditLogMetadata {
  actions: string[];
  resources: string[];
  httpMethods: string[];
  usernames: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly baseUrl = `${(environment as any).apiUrl || (environment as any).apiURL || 'http://localhost:8080'}/api/audit/logs`;

  constructor(private http: HttpClient) {}

  searchLogs(filter: AuditLogFilter): Observable<AuditLogSearchResponse> {
    return this.http.post<AuditLogSearchResponse>(`${this.baseUrl}/search`, filter);
  }

  getMetadata(): Observable<AuditLogMetadata> {
    return this.http.get<AuditLogMetadata>(`${this.baseUrl}/metadata`);
  }
}

