import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { Collaboration } from '../models/collaboration.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private collaborationInvitationsSubject = new BehaviorSubject<Collaboration[]>([]);
  private collaborationStatusUpdatesSubject = new BehaviorSubject<Collaboration | null>(null);

  constructor() { }

  /**
   * Initialize SignalR connection
   */
  public startConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.hubConnection) {
        return resolve();
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        return reject('No authentication token found');
      }

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(`http://localhost:5051/hubs/collaboration?access_token=${token}`)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      this.hubConnection
        .start()
        .then(() => {
          console.log('SignalR connection started');
          this.registerSignalREvents();
          resolve();
        })
        .catch(err => {
          console.error('Error starting SignalR connection:', err);
          reject(err);
        });
    });
  }

  /**
   * Stop SignalR connection
   */
  public stopConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.hubConnection) {
        return resolve();
      }

      this.hubConnection
        .stop()
        .then(() => {
          console.log('SignalR connection stopped');
          this.hubConnection = null;
          resolve();
        })
        .catch(err => {
          console.error('Error stopping SignalR connection:', err);
          reject(err);
        });
    });
  }

  /**
   * Register SignalR event handlers
   */
  private registerSignalREvents(): void {
    if (!this.hubConnection) return;

    // Handle receiving a new collaboration invitation
    this.hubConnection.on('ReceiveInvitation', (collaboration: Collaboration) => {
      console.log('Received collaboration invitation:', collaboration);
      const currentInvitations = this.collaborationInvitationsSubject.value;
      this.collaborationInvitationsSubject.next([...currentInvitations, collaboration]);
    });

    // Handle collaboration status updates
    this.hubConnection.on('ReceiveInvitationResponse', (collaboration: Collaboration) => {
      console.log('Received collaboration status update:', collaboration);
      this.collaborationStatusUpdatesSubject.next(collaboration);
    });
  }

  /**
   * Get observable for collaboration invitations
   */
  public getCollaborationInvitations(): Observable<Collaboration[]> {
    return this.collaborationInvitationsSubject.asObservable();
  }

  /**
   * Get observable for collaboration status updates
   */
  public getCollaborationStatusUpdates(): Observable<Collaboration | null> {
    return this.collaborationStatusUpdatesSubject.asObservable();
  }

  /**
   * Add a new invitation to the invitations list
   */
  public addInvitation(invitation: Collaboration): void {
    const currentInvitations = this.collaborationInvitationsSubject.value;
    this.collaborationInvitationsSubject.next([...currentInvitations, invitation]);
  }

  /**
   * Clear all invitations
   */
  public clearInvitations(): void {
    this.collaborationInvitationsSubject.next([]);
  }
}
