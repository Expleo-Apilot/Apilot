import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Collaboration, CollaborationStatus } from '../../../core/models/collaboration.model';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { SignalRService } from '../../../core/services/signalr.service';

@Component({
  selector: 'app-invitation-notifications',
  standalone: false,
  templateUrl: './invitation-notifications.component.html',
  styleUrls: ['./invitation-notifications.component.css']
})
export class InvitationNotificationsComponent implements OnInit, OnDestroy {
  pendingInvitations: Collaboration[] = [];
  showNotificationsPanel = false;
  loading = false;
  error = '';

  private invitationSubscription: Subscription | null = null;
  private statusUpdateSubscription: Subscription | null = null;

  constructor(
    private collaborationService: CollaborationService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    // Load pending invitations
    this.loadPendingInvitations();

    // Subscribe to new invitations
    this.invitationSubscription = this.signalRService.getCollaborationInvitations()
      .subscribe(invitations => {
        if (invitations && invitations.length > 0) {
          // Update the pending invitations list
          this.pendingInvitations = [...invitations];
          // Show a browser notification if the panel is not open
          if (!this.showNotificationsPanel) {
            this.showBrowserNotification('New collaboration invitation', 'You have received a new collaboration invitation');
          }
        }
      });

    // Subscribe to status updates
    this.statusUpdateSubscription = this.signalRService.getCollaborationStatusUpdates()
      .subscribe(update => {
        if (update) {
          // Remove the invitation from the list if it was accepted or declined
          this.pendingInvitations = this.pendingInvitations.filter(inv => inv.id !== update.id);
        }
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.invitationSubscription) {
      this.invitationSubscription.unsubscribe();
    }

    if (this.statusUpdateSubscription) {
      this.statusUpdateSubscription.unsubscribe();
    }
  }

  loadPendingInvitations(): void {
    this.loading = true;
    this.error = '';

    this.collaborationService.getPendingCollaborationsForUser().subscribe({
      next: (response) => {
        this.loading = false;
        console.log(response);
        if (response.success && response.data) {
          this.pendingInvitations = response.data;
        } else {
          this.error = response.message || 'Failed to load invitations';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || err.message || 'An error occurred while loading invitations';
      }
    });
  }

  toggleNotificationsPanel(): void {
    this.showNotificationsPanel = !this.showNotificationsPanel;

    // Reload pending invitations when opening the notifications panel
    if (this.showNotificationsPanel) {
      this.loadPendingInvitations();
    }
    this.loadPendingInvitations()
    console.log("invitations" )
  }

  updateInvitationStatus(collaborationId: number, status: number): void {
    this.loading = true;

    this.collaborationService.updateCollaborationStatus({
      collaborationId: collaborationId,
      status: status
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          // Remove the invitation from the list
          this.pendingInvitations = this.pendingInvitations.filter(inv => inv.id !== collaborationId);

          // If there are no more pending invitations, close the notifications panel
          if (this.pendingInvitations.length === 0) {
            this.showNotificationsPanel = false;
          }
        } else {
          this.error = response.message || 'Failed to update invitation status';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || err.message || 'An error occurred while updating invitation status';
      }
    });
  }

  /**
   * Shows a browser notification if permissions are granted
   * @param title Notification title
   * @param body Notification body text
   */
  private showBrowserNotification(title: string, body: string): void {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }
}
