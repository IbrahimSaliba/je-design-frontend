import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule, } from '@angular/router';
import { Subscription } from "rxjs";
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../services/theme.service';
import { ILayoutConf, LayoutService } from '../../../services/layout.service';
import { JwtAuthService } from '../../../services/auth/jwt-auth.service';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { FooterComponent } from '../../footer/footer.component';
import { HeaderSideComponent } from '../../header-side/header-side.component';
import { SidebarSideComponent } from '../../sidebar-side/sidebar-side.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { EgretNotifications2Component } from '../../egret-notifications2/egret-notifications2.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PerfectScrollbarModule } from '../../../components/perfect-scrollbar';

@Component({
  selector: 'app-vertical-layout',
  templateUrl: './vertical-layout.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    FooterComponent,
    HeaderSideComponent,
    SidebarSideComponent,
    NotificationsComponent,
    EgretNotifications2Component,
    MatSidenavModule,
    PerfectScrollbarModule
  ]
})
export class VerticalLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  private moduleLoaderSub: Subscription;
  private layoutConfSub: Subscription;
  private routerEventSub: Subscription;
  public scrollConfig = {
    suppressScrollX: true
  }
  public layoutConf: ILayoutConf = {};
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

  sidebarMouseenter(e) {
    if(this.layoutConf.sidebarStyle === 'compact') {
      this.layoutConf.sidebarStyle = 'full';
      this.adminContainerClasses = this.updateAdminContainerClasses(this.layoutConf);
      this.cdr.markForCheck();
    }
  }

  sidebarMouseleave(e) {
    if (
      this.layoutConf.sidebarStyle === 'full' &&
      this.layoutConf.sidebarCompactToggle
    ) {
      this.layoutConf.sidebarStyle = 'compact';
      this.adminContainerClasses = this.updateAdminContainerClasses(this.layoutConf);
      this.cdr.markForCheck();
    }
  }

  updateAdminContainerClasses(layoutConf) {
    return {
      'navigation-side': true,
      'sidebar-full': layoutConf.sidebarStyle === 'full',
      'sidebar-compact': layoutConf.sidebarStyle === 'compact',
      'compact-toggle-active': layoutConf.sidebarCompactToggle,
      'sidebar-compact-big': layoutConf.sidebarStyle === 'compact-big',
      'sidebar-opened': layoutConf.sidebarStyle !== 'closed',
      'sidebar-closed': layoutConf.sidebarStyle === 'closed',
      'fixed-topbar': layoutConf.topbarFixed
    };
  }
} 