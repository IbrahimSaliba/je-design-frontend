import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtAuthService } from './auth/jwt-auth.service';
import { environment } from 'environments/environment';

export interface ClientGeoDTO {
  id: string;
  name: string;
  phone1?: string;
  status: string;
  
  // Municipality data
  municipalityId?: string;
  municipalityName?: string;
  municipalityNameAr?: string;
  district?: string;
  districtAr?: string;
  governorate?: string;
  governorateAr?: string;
  
  // Geographic coordinates
  latitude?: number;
  longitude?: number;
}

export interface MunicipalityStatsDTO {
  municipalityName: string;
  municipalityNameAr?: string;
  district: string;
  governorate: string;
  clientCount: number;
  latitude?: number;
  longitude?: number;
}

export interface GeoStatisticsDTO {
  totalClients: number;
  clientsWithLocation: number;
  clientsWithoutLocation: number;
  totalMunicipalities: number;
  
  byGovernorate: { [key: string]: number };
  byStatus: { [key: string]: number };
  
  topMunicipalities: MunicipalityStatsDTO[];
  topRegionName?: string;
  topRegionCount?: number;
}

export interface GeoDistributionResponse {
  clients: ClientGeoDTO[];
  statistics: GeoStatisticsDTO;
}

@Injectable({
  providedIn: 'root'
})
export class GeoDistributionService {
  private apiUrl = environment.apiURL + '/api/clients';

  constructor(
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtAuth.getJwtToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get geographic distribution of clients
   * @param governorate Optional filter by governorate
   * @param status Optional filter by client status
   */
  getGeoDistribution(governorate?: string, status?: string): Observable<GeoDistributionResponse> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    
    if (governorate) {
      params = params.set('governorate', governorate);
    }
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<GeoDistributionResponse>(
      `${this.apiUrl}/geo-distribution`,
      { headers, params }
    );
  }
}

