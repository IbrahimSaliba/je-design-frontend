import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { GeoDistributionService, ClientGeoDTO, GeoStatisticsDTO } from '../../../shared/services/geo-distribution.service';
import { MunicipalityService, Governorate } from '../../../shared/services/municipality.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-distribution-map',
    templateUrl: './distribution-map.component.html',
    styleUrls: ['./distribution-map.component.scss'],
    standalone: false
})
export class DistributionMapComponent implements OnInit, OnDestroy {
  public map!: L.Map;  // Changed to public for template access
  private markerClusterGroup!: L.MarkerClusterGroup;
  private destroy$ = new Subject<void>();

  // Data
  clients: ClientGeoDTO[] = [];
  statistics: GeoStatisticsDTO | null = null;
  governorates: Governorate[] = [];

  // Filters
  selectedGovernorate: string = '';
  selectedStatus: string = '';

  // UI State
  isLoading: boolean = true;
  error: string | null = null;
  showHeatmap: boolean = false;

  // Lebanon geographic center
  private lebanonCenter: L.LatLngExpression = [33.8547, 35.8623];
  private lebanonBounds: L.LatLngBoundsExpression = [
    [33.054, 35.100],  // Southwest coordinates
    [34.691, 36.625]   // Northeast coordinates
  ];

  // Status colors
  private statusColors: { [key: string]: string } = {
    'ACTIVE': '#10b981',    // Green
    'PENDING': '#f59e0b',   // Yellow/Orange
    'INACTIVE': '#ef4444',  // Red
    'DEFAULT': '#3b82f6'    // Blue
  };

  constructor(
    private geoService: GeoDistributionService,
    private municipalityService: MunicipalityService
  ) {}

  ngOnInit(): void {
    this.loadGovernorates();
    this.loadData();
    
    // Add window resize listener to fix map on window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Remove resize listener
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Handle window resize event
   */
  private onWindowResize(): void {
    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    }
  }

  /**
   * Load governorates for filter dropdown
   */
  loadGovernorates(): void {
    this.municipalityService.getGovernorates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.governorates = data;
        },
        error: (error) => {
          console.error('Error loading governorates:', error);
        }
      });
  }

  /**
   * Load client geo-distribution data
   */
  loadData(): void {
    this.isLoading = true;
    this.error = null;

    this.geoService.getGeoDistribution(this.selectedGovernorate, this.selectedStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.clients = response.clients;
          this.statistics = response.statistics;
          this.isLoading = false;

          console.log(`✅ Loaded ${this.clients.length} clients`);

          // Initialize or update map after data loads
          if (!this.map) {
            setTimeout(() => this.initMap(), 100);
          } else {
            this.updateMarkers();
            // Multiple invalidateSize calls to ensure map renders properly
            // Immediate call
            this.map.invalidateSize();
            
            // After short delay (for DOM updates)
            setTimeout(() => {
              if (this.map) {
                this.map.invalidateSize();
                console.log('🗺️ Map size recalculated');
              }
            }, 100);
            
            // After longer delay (for animations/transitions)
            setTimeout(() => {
              if (this.map) {
                this.map.invalidateSize();
                // If we have markers, fit bounds to show them all
                if (this.clients.length > 0 && this.markerClusterGroup.getLayers().length > 0) {
                  const bounds = this.markerClusterGroup.getBounds();
                  if (bounds.isValid()) {
                    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                    console.log('📍 Map fitted to show all markers');
                  }
                }
              }
            }, 300);
          }
        },
        error: (error) => {
          console.error('Error loading geo-distribution:', error);
          this.error = 'Failed to load distribution data. Please try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Initialize Leaflet map
   */
  private initMap(): void {
    try {
      // Create map instance
      this.map = L.map('distribution-map', {
        center: this.lebanonCenter,
        zoom: 9,
        minZoom: 8,
        maxZoom: 16,
        maxBounds: this.lebanonBounds,
        maxBoundsViscosity: 0.75
      });

      // Add OpenStreetMap tiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        crossOrigin: true
      });
      
      tileLayer.addTo(this.map);

      // Fix map size after tiles start loading
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      // Force another size recalculation after tiles load
      tileLayer.on('load', () => {
        if (this.map) {
          this.map.invalidateSize();
        }
      });

      // Initialize marker cluster group
      this.markerClusterGroup = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        iconCreateFunction: (cluster) => this.createClusterIcon(cluster)
      });

      this.map.addLayer(this.markerClusterGroup);

      // Add markers
      this.updateMarkers();

      // Fix Leaflet default icon issue
      this.fixLeafletIconIssue();
      
      // Final size fix after everything is ready
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          console.log('✅ Map fully initialized and resized');
        }
      }, 500);
    } catch (error) {
      console.error('Error initializing map:', error);
      this.error = 'Failed to initialize map. Please refresh the page.';
    }
  }

  /**
   * Fix Leaflet default marker icon issue (common in Angular/Webpack)
   */
  private fixLeafletIconIssue(): void {
    const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
    const iconUrl = 'assets/leaflet/marker-icon.png';
    const shadowUrl = 'assets/leaflet/marker-shadow.png';

    const defaultIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = defaultIcon;
  }

  /**
   * Create custom cluster icon based on size
   */
  private createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
    const count = cluster.getChildCount();
    let sizeClass = 'small';
    let color = '#3b82f6'; // Blue

    if (count > 30) {
      sizeClass = 'large';
      color = '#ef4444'; // Red
    } else if (count > 10) {
      sizeClass = 'medium';
      color = '#f59e0b'; // Orange
    }

    return L.divIcon({
      html: `<div><span>${count}</span></div>`,
      className: `marker-cluster marker-cluster-${sizeClass}`,
      iconSize: L.point(40, 40)
    });
  }

  /**
   * Update markers on the map
   */
  private updateMarkers(): void {
    if (!this.markerClusterGroup) return;

    // Clear existing markers
    this.markerClusterGroup.clearLayers();

    // Add new markers for clients with location
    let markersAdded = 0;
    this.clients.forEach(client => {
      if (client.latitude && client.longitude) {
        const marker = this.createMarker(client);
        this.markerClusterGroup.addLayer(marker);
        markersAdded++;
      }
    });

    console.log(`📍 Added ${markersAdded} markers to map`);

    // If no markers, reset view to Lebanon center
    if (markersAdded === 0 && this.map) {
      this.map.setView(this.lebanonCenter, 9);
    }
  }

  /**
   * Create a marker for a client
   */
  private createMarker(client: ClientGeoDTO): L.Marker {
    const color = this.statusColors[client.status] || this.statusColors['DEFAULT'];

    // Custom icon based on status
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([client.latitude!, client.longitude!], { icon });

    // Create popup content
    const popupContent = this.createPopupContent(client);
    marker.bindPopup(popupContent);

    return marker;
  }

  /**
   * Create popup HTML content for a client
   */
  private createPopupContent(client: ClientGeoDTO): string {
    const statusBadgeColor = this.statusColors[client.status] || this.statusColors['DEFAULT'];
    
    return `
      <div class="client-popup" style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
          👤 ${client.name}
        </h3>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <div style="margin-bottom: 6px;">
          <strong style="color: #6b7280; font-size: 12px;">📍 Location:</strong><br>
          <span style="font-size: 13px; color: #374151;">
            ${client.municipalityName || 'N/A'}, ${client.district || 'N/A'}<br>
            ${client.governorate || 'N/A'}
          </span>
        </div>
        
        ${client.phone1 ? `
          <div style="margin-bottom: 6px;">
            <strong style="color: #6b7280; font-size: 12px;">📞 Phone:</strong><br>
            <span style="font-size: 13px; color: #374151;">${client.phone1}</span>
          </div>
        ` : ''}
        
        <div style="margin-bottom: 6px;">
          <strong style="color: #6b7280; font-size: 12px;">Status:</strong>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; background-color: ${statusBadgeColor}; margin-left: 4px;">
            ${client.status}
          </span>
        </div>
        
        <button 
          onclick="window.location.href='#/cruds/clients'" 
          style="margin-top: 10px; padding: 6px 12px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; width: 100%;">
          View Full Details →
        </button>
      </div>
    `;
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    console.log('🔄 Filter changed - reloading data...');
    this.loadData();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    console.log('🧹 Clearing all filters');
    this.selectedGovernorate = '';
    this.selectedStatus = '';
    this.loadData();
  }

  /**
   * Get statistics entries as array for template iteration
   */
  getGovernorateStats(): Array<{ name: string; count: number }> {
    if (!this.statistics?.byGovernorate) return [];
    
    return Object.entries(this.statistics.byGovernorate)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate percentage for a governorate
   */
  getPercentage(count: number): number {
    if (!this.statistics?.totalClients) return 0;
    return Math.round((count / this.statistics.totalClients) * 100);
  }
}

