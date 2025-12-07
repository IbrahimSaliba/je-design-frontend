import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingOverlayService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string>('');
  private isBlockingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();
  public message$ = this.messageSubject.asObservable();
  public isBlocking$ = this.isBlockingSubject.asObservable();

  /**
   * Shows a loading overlay
   * @param message Optional message to display
   * @param isBlocking Whether the overlay should block user interaction
   */
  show(message: string = 'Loading...', isBlocking: boolean = false): void {
    this.messageSubject.next(message);
    this.isBlockingSubject.next(isBlocking);
    this.loadingSubject.next(true);
  }

  /**
   * Hides the loading overlay
   */
  hide(): void {
    this.loadingSubject.next(false);
    this.messageSubject.next('');
    this.isBlockingSubject.next(false);
  }

  /**
   * Shows a blocking overlay for session expiration
   * @param message Message to display
   */
  showSessionExpired(message: string = 'Session expired. Please sign in again.'): void {
    this.show(message, true);
  }

  /**
   * Shows a non-blocking loading overlay
   * @param message Message to display
   */
  showLoading(message: string = 'Loading...'): void {
    this.show(message, false);
  }

  /**
   * Gets the current loading state
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Gets the current message
   */
  get currentMessage(): string {
    return this.messageSubject.value;
  }

  /**
   * Gets whether the overlay is blocking
   */
  get isBlocking(): boolean {
    return this.isBlockingSubject.value;
  }
}
