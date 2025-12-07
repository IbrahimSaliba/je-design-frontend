import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, NavigationStart, Router, RouterModule } from '@angular/router';
import { Subscription, interval } from "rxjs";
import { LayoutService } from '../../../services/layout.service';
import { JwtAuthService } from '../../../services/auth/jwt-auth.service';
import { AuthMonitorService } from '../../../services/auth-monitor.service';
import { NavigationService } from '../../../services/navigation.service';
import { StockAlertService } from '../../../services/stock-alert.service';
import { CustomizerComponent } from '../../customizer/customizer.component';
import { HorizontalLayoutComponent } from '../horizontal-layout/horizontal-layout.component';
import { VerticalLayoutComponent } from '../vertical-layout/vertical-layout.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      HorizontalLayoutComponent,
      VerticalLayoutComponent,
      CustomizerComponent,
      MatProgressBarModule
    ]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private layoutConfSub: Subscription;
  private moduleLoaderSub: Subscription;
  private badgeUpdateSub: Subscription;
  public layoutConf: any = {};
  public isModuleLoading: Boolean = false;
  
  constructor(
    private layout: LayoutService,
    private router: Router,
    private jwtAuth: JwtAuthService,
    private authMonitor: AuthMonitorService,
    private navigationService: NavigationService,
    private stockAlertService: StockAlertService
  ) {
    // Check Auth Token is valid
    this.jwtAuth.checkTokenIsValid().subscribe();
    
    // Start monitoring token expiration
    this.authMonitor.startTokenMonitoring();
  }

  ngOnInit() {
    this.layoutConfSub = this.layout.layoutConf$.subscribe((layoutConf) => {
      this.layoutConf = layoutConf;
    });
     // FOR MODULE LOADER FLAG
     this.moduleLoaderSub = this.router.events.subscribe(event => {
      if(event instanceof NavigationStart) {
        this.isModuleLoading = true;
        console.log('NavigationStart');
      }
      if(event instanceof NavigationEnd) {
        this.isModuleLoading = false;
        console.log('NavigationEnd');
      }
    });
    
    // Update Stock Alerts badge count (initial load)
    this.updateStockAlertsBadge();
    
    // Poll for updates every 30 seconds (DISABLED - uncomment to enable)
    // this.badgeUpdateSub = interval(30000).subscribe(() => {
    //   this.updateStockAlertsBadge();
    // });
  }
  
  private updateStockAlertsBadge() {
    // Use new stock alerts statistics endpoint for accurate count
    this.stockAlertService.getAlertStatistics().subscribe(stats => {
      const count = stats.total || 0; // Total count of actual low/out-of-stock items
      console.log('🔔 ADMIN LAYOUT: Updating badge count to:', count, '(from new stock alerts API)');
      this.navigationService.updateStockAlertsBadge(count);
    });
  }
  
  ngOnDestroy() {
    if(this.layoutConfSub) {
      this.layoutConfSub.unsubscribe();
    }
    if(this.moduleLoaderSub) {
      this.moduleLoaderSub.unsubscribe();
    }
    if(this.badgeUpdateSub) {
      this.badgeUpdateSub.unsubscribe();
    }
    // Stop token monitoring when component is destroyed
    this.authMonitor.stopTokenMonitoring();
  }
}
