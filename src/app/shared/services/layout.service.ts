import { Injectable, Renderer2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getQueryParam } from '../helpers/url.helper';
import { ThemeService } from './theme.service';
import { config } from 'config';

export interface ILayoutConf {
  navigationPos?: string; // side, top
  sidebarStyle?: string; // full, compact, closed
  sidebarCompactToggle?: boolean; // sidebar expandable on hover
  sidebarColor?: string; // Sidebar background color
  dir?: string; // ltr, rtl
  isMobile?: boolean; // updated automatically
  useBreadcrumb?: boolean; // Breadcrumb enabled/disabled
  breadcrumb?: string; // simple, title
  topbarFixed?: boolean; // Fixed header
  matTheme?: string; // material theme. egret-navy, egret-navy-dark
}
export interface ILayoutChangeOptions {
  duration?: number;
  transitionClass?: boolean;
}
interface IAdjustScreenOptions {
  browserEvent?: any;
  route?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  public layoutConf: ILayoutConf = {};
  layoutConfSubject = new BehaviorSubject<ILayoutConf>(this.layoutConf);
  layoutConf$ = this.layoutConfSubject.asObservable();
  public isMobile: boolean;
  public currentRoute: string;
//   public fullWidthRoutes = ['shop'];
  public fullWidthRoutes = [];

  constructor(private themeService: ThemeService) {
    this.setAppLayout();
  }

  setAppLayout() {
    // ********** SET DEFAULT LAYOUT **********
    let defaultLayout: ILayoutConf = {
      navigationPos: 'side', // side, top
      sidebarStyle: 'full', // full, compact, closed
      sidebarCompactToggle: false, // if "sidebarStyle" is "compact" make it true
      dir: 'ltr', // ltr, rtl
      useBreadcrumb: true, 
      topbarFixed: false,
      sidebarColor: 'sidebar-dark', // sidebar-dark, sidebar-light
      matTheme: 'egret-navy', // egret-navy, egret-navy-dark
      breadcrumb: 'simple', // simple, title
    };
    this.publishLayoutChange(defaultLayout);

    // ******* Only for demo purpose ***
    this.setLayoutFromQuery();
    // **********************
  }

  publishLayoutChange(lc: ILayoutConf) {
    // if (this.layoutConf.matTheme !== lc.matTheme && lc.matTheme) {
      let themeId: string;
      try {
        themeId = localStorage.getItem(config.themeLocalStorageKey);
      } catch (e) {
        console.log('Error getting theme from local storage', e);
      }
      themeId = themeId || lc.matTheme;
      this.themeService.setActiveThemeById(themeId);
    // }

    this.layoutConf = Object.assign(this.layoutConf, lc);
    this.layoutConfSubject.next(this.layoutConf);
  }

  applyMatTheme(themeId: string) {
    this.themeService.setActiveThemeById(themeId);
  }

  setLayoutFromQuery() {
    const layoutConfString = getQueryParam('layout');
    if(!layoutConfString) {
      return;
    }
    try {
      this.layoutConf = JSON.parse(layoutConfString);
      this.themeService.setActiveThemeById(this.layoutConf.matTheme);
    } catch (e) {
      // console.log('Error parsing layout from query parameter', e);
    }
  }

  adjustLayout(options: IAdjustScreenOptions = {}) {
    let sidebarStyle: string;
    this.isMobile = this.isSm();
    this.currentRoute = options.route || this.currentRoute;
    sidebarStyle = this.isMobile ? 'closed' : 'full';

    if (this.currentRoute) {
      this.fullWidthRoutes.forEach((route) => {
        if (this.currentRoute.indexOf(route) !== -1) {
          sidebarStyle = 'closed';
        }
      });
    }

    this.publishLayoutChange({
      isMobile: this.isMobile,
      sidebarStyle,
    });
  }
  isSm() {
    return window.matchMedia(`(max-width: 959px)`).matches;
  }
}
