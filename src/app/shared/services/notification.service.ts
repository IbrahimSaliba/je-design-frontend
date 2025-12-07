import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { tap, switchMap, startWith } from 'rxjs/operators';
import { JwtAuthService } from './auth/jwt-auth.service';

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = 'http://localhost:8080/api/notifications';
  
  // Observable for unread count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  // Observable for notifications list
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  // Auto-refresh every 30 seconds
  private autoRefresh$ = interval(30000).pipe(
    startWith(0),
    switchMap(() => this.fetchUnreadNotifications())
  );

  constructor(
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) {
    console.log('🔔 NOTIFICATION SERVICE: Initializing...');
    // Start auto-refresh when service is created
    this.startAutoRefresh();
  }

  /**
   * Get HTTP headers with JWT token
   */
  private getHeaders(): HttpHeaders {
    const token = this.jwtAuth.getJwtToken();
    console.log('🔑 NOTIFICATION SERVICE: Token exists:', !!token);
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Start auto-refresh of notifications
   */
  startAutoRefresh(): void {
    console.log('🔄 NOTIFICATION SERVICE: Starting auto-refresh (every 30 seconds)...');
    this.autoRefresh$.subscribe({
      next: (notifications) => {
        console.log('✅ NOTIFICATION SERVICE: Received', notifications.length, 'notifications');
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(notifications.length);
        console.log('📊 NOTIFICATION SERVICE: Unread count updated to', notifications.length);
      },
      error: (error) => {
        console.error('❌ NOTIFICATION SERVICE: Error fetching notifications:', error);
        console.error('❌ Error details:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
      }
    });
  }

  /**
   * Fetch unread notifications from backend
   */
  fetchUnreadNotifications(): Observable<Notification[]> {
    console.log('📡 NOTIFICATION SERVICE: Fetching from', `${this.apiUrl}/unread`);
    const headers = this.getHeaders();
    return this.http.get<{ id: number; message: string; read: boolean; createdAt: string }[]>(
      `${this.apiUrl}/unread`,
      { headers }
    ).pipe(
      tap(response => {
        console.log('📬 NOTIFICATION SERVICE: Fetched', response.length, 'unread notifications');
        console.log('📬 Notifications data:', response);
      })
    );
  }

  /**
   * Manually refresh notifications (called when panel opens)
   */
  refreshNotifications(): void {
    this.fetchUnreadNotifications().subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(notifications.length);
      },
      error: (error) => {
        console.error('❌ Error refreshing notifications:', error);
      }
    });
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: number): Observable<string> {
    const headers = this.getHeaders();
    return this.http.put<string>(
      `${this.apiUrl}/${id}/read`,
      {},
      { headers, responseType: 'text' as 'json' }
    ).pipe(
      tap(() => {
        console.log('✅ Notification', id, 'marked as read');
        // Refresh the list after marking as read
        this.refreshNotifications();
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value;
    notifications.forEach(notification => {
      if (!notification.read) {
        this.markAsRead(notification.id).subscribe();
      }
    });
  }

  /**
   * Get current unread count
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Get current notifications list
   */
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }
}

