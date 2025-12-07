import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
// import PerfectScrollbar from 'perfect-scrollbar';
import { NavigationService } from "../../../shared/services/navigation.service";
import { Subscription } from "rxjs";
import { TranslateModule } from '@ngx-translate/core';
import { PerfectScrollbarModule } from 'app/shared/components/perfect-scrollbar';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { JwtAuthService } from '../../services/auth/jwt-auth.service';

@Component({
    selector: 'app-sidebar-top',
    templateUrl: './sidebar-top.component.html',
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatIconModule,
      MatButtonModule,
      MatMenuModule,
      TranslateModule,
      PerfectScrollbarModule,
      SidenavComponent
    ]
})
export class SidebarTopComponent implements OnInit, OnDestroy, AfterViewInit {
  // private sidebarPS: PerfectScrollbar;
  public menuItems: any[];
  private menuItemsSub: Subscription;
  @ViewChild('sidenav') sidenav:any;

  constructor(
    private navService: NavigationService,
    private jwtAuth: JwtAuthService
  ) { }

  ngOnInit() {
    // Get user role and filter menu accordingly
    const user = this.jwtAuth.getUser();
    const userRole = user?.role || 'ADMIN'; // Default to ADMIN if not found
    
    // Apply role-based filtering to initial menu
    this.navService.publishNavigationChangeForRole('icon-menu', userRole);
    
    this.menuItemsSub = this.navService.menuItems$.subscribe(menuItem => {
      this.menuItems = menuItem.filter(item => item.type !== 'icon' && item.type !== 'separator');
    });
  }
  ngAfterViewInit() {
    setTimeout(() => {
      const links = this.sidenav.sidenav.nativeElement.querySelectorAll('li[appdropdownlink]');
      [...links].forEach(link => {
        if(link.querySelector('a.open')) {
          // Add open class
          link.classList.add('open');
          // Scroll into view
          link.scrollIntoView();
        }
      })
    }, 50)
  }
  ngOnDestroy() {
    // if(this.sidebarPS) {
    //   this.sidebarPS.destroy();
    // }
    if( this.menuItemsSub ) {
      this.menuItemsSub.unsubscribe()
    }
  }

}
