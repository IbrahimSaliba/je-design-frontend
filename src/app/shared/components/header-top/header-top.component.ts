import { Component, OnInit, Input, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationService } from "../../../shared/services/navigation.service";
import { Subscription, Observable, interval } from 'rxjs';
import { ThemeService } from '../../../shared/services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../../services/layout.service';
import { JwtAuthService } from 'app/shared/services/auth/jwt-auth.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { commonMaterialModules } from 'app/shared/material-imports';

@Component({
    selector: 'app-header-top',
    templateUrl: './header-top.component.html',
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      ...commonMaterialModules,
      TranslateModule
    ]
})
export class HeaderTopComponent implements OnInit, OnDestroy {
  layoutConf: any;
  menuItems:any;
  menuItemSub: Subscription;
  themes: any[] = [];
  activeTheme: any;
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
  
  // Notification count observable
  unreadNotificationCount$: Observable<number>;
  
  // 🆕 Session Timer Properties
  sessionTimeRemaining: string = 'Loading...';
  sessionTimeColor: string = 'text-green-600';
  sessionIcon: string = 'check_circle';
  private timerSubscription: Subscription;

  @Input() notificPanel;
  constructor(
    private layout: LayoutService,
    private navService: NavigationService,
    public themeService: ThemeService,
    public translate: TranslateService,
    private renderer: Renderer2,
    public jwtAuth: JwtAuthService,
    public notificationService: NotificationService
  ) {
    // Subscribe to unread notification count
    this.unreadNotificationCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit() {
    console.log('📱 HEADER-TOP: Component initializing...');
    this.layoutConf = this.layout.layoutConf;
    this.themes = this.themeService.getAvailableThemes();
    this.activeTheme = this.themeService.getActiveTheme();
    this.translate.use(this.currentLang.code);
    
    // Get user role and filter menu accordingly
    const user = this.jwtAuth.getUser();
    const userRole = user?.role || 'ADMIN'; // Default to ADMIN if not found
    
    // Apply role-based filtering to initial menu
    this.navService.publishNavigationChangeForRole('icon-menu', userRole);
    
    this.menuItemSub = this.navService.menuItems$
    .subscribe(res => {
      res = res.filter(item => item.type !== 'icon' && item.type !== 'separator');
      let limit = 4
      let mainItems:any[] = res.slice(0, limit)
      if(res.length <= limit) {
        return this.menuItems = mainItems
      }
      let subItems:any[] = res.slice(limit, res.length - 1)
      mainItems.push({
        name: 'More',
        type: 'dropDown',
        tooltip: 'More',
        icon: 'more_horiz',
        sub: subItems
      })
      this.menuItems = mainItems
    })
    
    // Subscribe to notification count changes and log them
    this.unreadNotificationCount$.subscribe(count => {
      console.log('🔔 HEADER-TOP: Notification count updated to', count);
    });
    
    // 🆕 Start session timer
    this.startSessionTimer();
  }
  
  ngOnDestroy() {
    this.menuItemSub.unsubscribe();
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
  changeTheme(theme: any) {
    this.themeService.setActiveThemeById(theme.id);
    this.layout.publishLayoutChange({matTheme: theme.id});
  }
  toggleNotific() {
    this.notificPanel.toggle();
    // Refresh notifications when panel opens
    if (this.notificPanel.opened) {
      this.notificationService.refreshNotifications();
    }
  }
  toggleSidenav() {
    if(this.layoutConf.sidebarStyle === 'closed') {
      return this.layout.publishLayoutChange({
        sidebarStyle: 'full'
      })
    }
    this.layout.publishLayoutChange({
      sidebarStyle: 'closed'
    })
  }
}
