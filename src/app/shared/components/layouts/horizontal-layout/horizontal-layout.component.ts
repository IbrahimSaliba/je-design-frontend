import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from "rxjs";
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../services/theme.service';
import { LayoutService } from '../../../services/layout.service';
import { JwtAuthService } from '../../../services/auth/jwt-auth.service';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { FooterComponent } from '../../footer/footer.component';
import { HeaderTopComponent } from '../../header-top/header-top.component';
import { SidebarTopComponent } from '../../sidebar-top/sidebar-top.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { EgretNotifications2Component } from '../../egret-notifications2/egret-notifications2.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PerfectScrollbarModule, PerfectScrollbarDirective } from '../../../components/perfect-scrollbar';

@Component({
  selector: 'app-horizontal-layout',
  templateUrl: './horizontal-layout.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    FooterComponent,
    HeaderTopComponent,
    SidebarTopComponent,
    NotificationsComponent,
    EgretNotifications2Component,
    MatSidenavModule,
    PerfectScrollbarModule
  ]
})
export class HorizontalLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  public isModuleLoading: Boolean = false;
  private moduleLoaderSub: Subscription;
  private layoutConfSub: Subscription;
  private routerEventSub: Subscription;

  public scrollConfig = {}
  public layoutConf: any = {};
  public adminContainerClasses: any = {};
  
  constructor(
    private router: Router,
    public translate: TranslateService,
    public themeService: ThemeService,
    private layout: LayoutService,
    private cdr: ChangeDetectorRef,
    private jwtAuth: JwtAuthService
  ) {
    // Close sidenav after route change in mobile
    this.routerEventSub = router.events.pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((routeChange: NavigationEnd) => {
      this.layout.adjustLayout({ route: routeChange.url });
      this.scrollToTop();
    });
  }

  ngOnInit() {
    this.layoutConfSub = this.layout.layoutConf$.subscribe((layoutConf) => {
      this.layoutConf = layoutConf;
      this.adminContainerClasses = this.updateAdminContainerClasses(this.layoutConf);
      this.cdr.markForCheck();
    });

    // FOR MODULE LOADER FLAG
    this.moduleLoaderSub = this.router.events.subscribe(event => {
      if(event instanceof NavigationEnd) {
        this.isModuleLoading = false;
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.layout.adjustLayout(event);
  }
  
  ngAfterViewInit() {}
  
  scrollToTop() {
    if(document) {
      setTimeout(() => {
        let element;
        if(this.layoutConf.topbarFixed) {
          element = <HTMLElement>document.querySelector('#rightside-content-hold');
        } else {
          element = <HTMLElement>document.querySelector('#main-content-wrap');
        }
        element.scrollTop = 0;
      });
    }
  }

  ngOnDestroy() {
    if(this.moduleLoaderSub) {
      this.moduleLoaderSub.unsubscribe();
    }
    if(this.layoutConfSub) {
      this.layoutConfSub.unsubscribe();
    }
    if(this.routerEventSub) {
      this.routerEventSub.unsubscribe();
    }
  }

  closeSidebar() {
    this.layout.publishLayoutChange({
      sidebarStyle: 'closed'
    });
  }

  updateAdminContainerClasses(layoutConf) {
    return {
      'navigation-top': true,
      'sidebar-compact': layoutConf.sidebarStyle === 'compact' && layoutConf.isMobile,
      'sidebar-closed': layoutConf.sidebarStyle === 'closed' && layoutConf.isMobile,
      'fixed-topbar': layoutConf.topbarFixed
    };
  }
} 