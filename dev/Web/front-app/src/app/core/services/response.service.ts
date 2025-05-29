import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  // Store responses by tab ID
  private responseMap = new Map<string, any>();
  private currentTabIdSubject = new BehaviorSubject<string | null>(null);
  private responseDataSubject = new BehaviorSubject<any>(null);

  constructor() { }

  get responseData$(): Observable<any> {
    return this.responseDataSubject.asObservable();
  }

  get currentTabId$(): Observable<string | null> {
    return this.currentTabIdSubject.asObservable();
  }

  // Get response for a specific tab
  getResponseForTab(tabId: string): any {
    return this.responseMap.get(tabId) || null;
  }

  // Set the current active tab ID
  setCurrentTabId(tabId: string | null): void {
    this.currentTabIdSubject.next(tabId);
    
    // Update the current response data based on the tab
    if (tabId) {
      this.responseDataSubject.next(this.getResponseForTab(tabId));
    } else {
      this.responseDataSubject.next(null);
    }
  }

  // Update response data for a specific tab
  updateResponseData(data: any, tabId?: string | null): void {
    const targetTabId = tabId || this.currentTabIdSubject.getValue();
    
    if (targetTabId) {
      // Store the response for this tab
      this.responseMap.set(targetTabId, data);
      
      // If this is the current tab, update the observable
      if (targetTabId === this.currentTabIdSubject.getValue()) {
        this.responseDataSubject.next(data);
      }
    } else {
      // Fallback to just updating the current response data
      this.responseDataSubject.next(data);
    }
  }

  // Clear response data for a specific tab
  clearResponseData(tabId?: string | null): void {
    const targetTabId = tabId || this.currentTabIdSubject.getValue();
    
    if (targetTabId) {
      // Remove the response for this tab
      this.responseMap.delete(targetTabId);
      
      // If this is the current tab, update the observable
      if (targetTabId === this.currentTabIdSubject.getValue()) {
        this.responseDataSubject.next(null);
      }
    } else {
      // Fallback to just clearing the current response data
      this.responseDataSubject.next(null);
    }
  }
  
  // Clear all responses (useful when resetting the application)
  clearAllResponses(): void {
    this.responseMap.clear();
    this.responseDataSubject.next(null);
  }

  public getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });
  }

  public getHttpOptions() {
    return {
      headers: this.getAuthHeaders()
    };
  }
}
