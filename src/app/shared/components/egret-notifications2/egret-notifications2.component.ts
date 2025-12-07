import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenav } from '@angular/material/sidenav';
import { NotificationService, Notification } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'egret-notifications2',
    templateUrl: './egret-notifications2.component.html',
    styleUrls: ['./egret-notifications2.component.scss'],
    standalone: true,
    imports: [
      CommonModule, 
      MatIconModule, 
      MatButtonModule, 
      MatTooltipModule,
      MatBadgeModule
    ]
})
export class EgretNotifications2Component implements OnInit {
  @Input() notificPanel: MatSidenav;
  
  notifications$: Observable<Notification[]>;
  unreadCount$: Observable<number>;

  constructor(public notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    // Refresh notifications when panel is initialized
    this.notificationService.refreshNotifications();
  }

  /**
   * Mark a single notification as read
   */
  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
    
    // On mobile, close panel after clicking notification
    if (window.innerWidth < 768) {
      setTimeout(() => this.closePanel(), 500); // Small delay to show the click effect
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  /**
   * Get notification icon based on message content
   */
  getNotificationIcon(message: string): string {
    if (message.toLowerCase().includes('low stock') || message.toLowerCase().includes('⚠️')) {
      return 'warning';
    } else if (message.toLowerCase().includes('invoice')) {
      return 'receipt';
    } else if (message.toLowerCase().includes('payment')) {
      return 'payment';
    } else if (message.toLowerCase().includes('order')) {
      return 'shopping_cart';
    } else if (message.toLowerCase().includes('event')) {
      return 'event';
    } else {
      return 'notifications';
    }
  }

  /**
   * Get notification color based on message content
   */
  getNotificationColor(message: string): string {
    if (message.toLowerCase().includes('low stock') || message.toLowerCase().includes('⚠️')) {
      return 'text-orange-600';
    } else if (message.toLowerCase().includes('invoice')) {
      return 'text-green-600';
    } else if (message.toLowerCase().includes('payment')) {
      return 'text-blue-600';
    } else {
      return 'text-gray-600';
    }
  }

  /**
   * Get time ago string (e.g., "5 minutes ago")
   */
  getTimeAgo(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return created.toLocaleDateString();
  }

  /**
   * Close the notification panel (for mobile)
   */
  closePanel(): void {
    if (this.notificPanel) {
      this.notificPanel.close();
    }
  }
}
