import { Component, OnInit, EventEmitter, Input, ViewChildren, Output, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, Subscription, interval } from 'rxjs';
import { commonMaterialModules } from '../../material-imports';
import { ThemeService } from '../../services/theme.service';
import { LayoutService } from '../../services/layout.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { JwtAuthService } from '../../services/auth/jwt-auth.service';
import { NotificationService } from '../../services/notification.service';
import { SearchModule } from '../../search/search.module';

@Component({
    selector: 'app-header-side',
    templateUrl: './header-side.template.html',
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      ...commonMaterialModules,
      TranslateModule,
      SearchModule
    ]
})
export class HeaderSideComponent implements OnInit, OnDestroy {
  @Input() notificPanel;
  public availableLangs = [{
    name: 'EN',
    code: 'en',
    flag: 'us'
  }, {
    name: 'AR',
    code: 'ar',
    flag: 'sa'
  }];
  currentLang = this.availableLangs[0];

  public themes: any[] = [];
  public activeTheme: any;
  public layoutConf: any;
  
  // Notification count observable
  unreadNotificationCount$: Observable<number>;
  
  // 🆕 Session Timer Properties
  sessionTimeRemaining: string = 'Loading...';
  sessionTimeColor: string = 'text-green-600';
  sessionIcon: string = 'check_circle';
  private timerSubscription: Subscription;
  
  constructor(
    private themeService: ThemeService,
    private layout: LayoutService,
    public translate: TranslateService,
    private renderer: Renderer2,
    public jwtAuth: JwtAuthService,
    public notificationService: NotificationService
  ) {
    // Subscribe to unread notification count
    this.unreadNotificationCount$ = this.notificationService.unreadCount$;
  }
  
  ngOnInit() {
    console.log('📱 HEADER-SIDE: Component initializing...');
    this.themes = this.themeService.getAvailableThemes();
    this.activeTheme = this.themeService.getActiveTheme();
    this.layoutConf = this.layout.layoutConf;
    this.translate.use(this.currentLang.code);
    
    // Subscribe to notification count changes and log them
    this.unreadNotificationCount$.subscribe(count => {
      console.log('🔔 HEADER-SIDE: Notification count updated to', count);
    });
    
    // 🆕 Start session timer
    this.startSessionTimer();
  }
  
  ngOnDestroy() {
    // Clean up timer
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
  
  // 🆕 Session Timer Methods
  private startSessionTimer() {
    // Update timer every second
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateSessionTimer();
    });
  }
  
  private updateSessionTimer() {
    try {
      const token = this.jwtAuth.getJwtToken();
      if (!token) {
        this.sessionTimeRemaining = 'Not logged in';
        this.sessionTimeColor = 'text-gray-500';
        this.sessionIcon = 'error_outline';
        return;
      }
      
      // Decode JWT to get expiration
      const payload = this.decodeJwtPayload(token);
      if (!payload || !payload.exp) {
        this.sessionTimeRemaining = 'Invalid token';
        this.sessionTimeColor = 'text-red-600';
        this.sessionIcon = 'error';
        return;
      }
      
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeLeft = expirationTime - currentTime;
      
      if (timeLeft <= 0) {
        this.sessionTimeRemaining = 'Expired';
        this.sessionTimeColor = 'text-red-600';
        this.sessionIcon = 'error';
        return;
      }
      
      // Calculate minutes and seconds
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      
      // Format time
      this.sessionTimeRemaining = `${minutes}m ${seconds}s`;
      
      // Set color and icon based on time remaining
      if (minutes < 5) {
        this.sessionTimeColor = 'text-red-600';
        this.sessionIcon = 'error';
      } else if (minutes < 10) {
        this.sessionTimeColor = 'text-yellow-600';
        this.sessionIcon = 'warning';
      } else if (minutes >= 55) {
        // Recently refreshed
        this.sessionTimeColor = 'text-green-600';
        this.sessionIcon = 'check_circle';
      } else {
        this.sessionTimeColor = 'text-blue-600';
        this.sessionIcon = 'schedule';
      }
      
    } catch (error) {
      console.error('Error updating session timer:', error);
      this.sessionTimeRemaining = 'Error';
      this.sessionTimeColor = 'text-gray-500';
      this.sessionIcon = 'error_outline';
    }
  }
  
  private decodeJwtPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }
  setLang(lng) {
    this.currentLang = lng;
    this.translate.use(lng.code);
    
    // Set RTL mode for Arabic
    if (lng.code === 'ar') {
      this.layout.publishLayoutChange({ dir: 'rtl' });
    } else {
      this.layout.publishLayoutChange({ dir: 'ltr' });
    }
  }
  changeTheme(themeId: string) {
    this.themeService.setActiveThemeById(themeId);
  }
  toggleNotific() {
    this.notificPanel.toggle();
    // Refresh notifications when panel opens
    if (this.notificPanel.opened) {
      this.notificationService.refreshNotifications();
    }
  }
  toggleSidenav() {
    if (this.layoutConf.sidebarStyle === 'closed') {
      return this.layout.publishLayoutChange({
        sidebarStyle: 'full'
      });
    }
    this.layout.publishLayoutChange({
      sidebarStyle: 'closed'
    });
  }

  toggleCollapse() {
    // compact --> full
    if (this.layoutConf.sidebarStyle === 'compact') {
      return this.layout.publishLayoutChange({
        sidebarStyle: 'full',
        sidebarCompactToggle: false
      });
    }

    // * --> compact
    this.layout.publishLayoutChange({
      sidebarStyle: 'compact',
      sidebarCompactToggle: true
    });

  }

  onSearch(e) {
    //   console.log(e)
  }
}
