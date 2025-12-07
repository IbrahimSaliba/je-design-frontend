import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, NavigationEnd } from '@angular/router';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatIconModule,
      MatButtonModule,
      MatListModule
    ]
})
export class NotificationsComponent implements OnInit {
  @Input() notificPanel;

  // No mock data - notifications should come from backend
  // TODO: Connect to real notifications service
  notifications = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe((routeChange) => {
        if (routeChange instanceof NavigationEnd) {
          this.notificPanel.close();
        }
    });
  }
  clearAll(e) {
    e.preventDefault();
    this.notifications = [];
  }
}
