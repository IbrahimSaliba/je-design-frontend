import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtAuthService } from './auth/jwt-auth.service';
import { environment } from 'environments/environment';

export interface Governorate {
  governorate: string;
  governorateAr: string;
  districtCount?: number;
  municipalityCount?: number;
}

export interface District {
  district: string;
  districtAr: string;
  governorate: string;
  governorateAr?: string;
  municipalityCount?: number;
}

export interface Municipality {
  id: string;
  municipalityName: string;
  municipalityNameAr: string;
  district: string;
  districtAr: string;
  governorate: string;
  governorateAr: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MunicipalityService {
  private apiUrl = environment.apiURL + '/api/municipalities';

  constructor(private http: HttpClient, private jwtAuth: JwtAuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtAuth.getJwtToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all governorates (المحافظات)
   */
  getGovernorates(): Observable<Governorate[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Governorate[]>(`${this.apiUrl}/governorates`, { headers });
  }

  /**
   * Get districts by governorate (الأقضية)
   */
  getDistrictsByGovernorate(governorate: string): Observable<District[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<District[]>(`${this.apiUrl}/districts`, {
      headers,
      params: { governorate }
    });
  }

  /**
   * Get municipalities by governorate and district (البلديات)
   */
  getMunicipalitiesByDistrict(governorate: string, district: string): Observable<Municipality[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Municipality[]>(`${this.apiUrl}`, {
      headers,
      params: { governorate, district }
    });
  }

  /**
   * Get single municipality by ID
   */
  getMunicipalityById(id: string): Observable<Municipality> {
    const headers = this.getAuthHeaders();
    return this.http.get<Municipality>(`${this.apiUrl}/${id}`, { headers });
  }
}

