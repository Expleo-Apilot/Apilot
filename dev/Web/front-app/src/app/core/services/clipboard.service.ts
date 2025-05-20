import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ClipboardNotification {
  message: string;
  type: 'success' | 'error';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private notificationIdCounter = 0;
  private notificationsSubject = new BehaviorSubject<ClipboardNotification[]>([]);
  public notifications$: Observable<ClipboardNotification[]> = this.notificationsSubject.asObservable();

  constructor() { }

  /**
   * Copy text to clipboard and show notification
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Response copied to clipboard', 'success');
      return true;
    } catch (error) {
      console.error('Failed to copy: ', error);
      this.showNotification('Failed to copy to clipboard', 'error');
      return false;
    }
  }

  /**
   * Show a notification
   */
  showNotification(message: string, type: 'success' | 'error'): void {
    const notification: ClipboardNotification = {
      message,
      type,
      id: this.notificationIdCounter++
    };

    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto remove notification after 3 seconds
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 3000);
  }

  /**
   * Remove a notification by id
   */
  removeNotification(id: number): void {
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }
}
