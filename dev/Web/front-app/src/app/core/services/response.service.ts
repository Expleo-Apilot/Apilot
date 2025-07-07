import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  // Store responses by tab ID
  private responseMap = new Map<string, any>();
  private currentTabIdSubject = new BehaviorSubject<string | null>(null);
  private responseDataSubject = new BehaviorSubject<any>(null);
  private baseUrl = environment.apiUrl || 'http://localhost:5051';

  constructor(private http: HttpClient) { }

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
  
  /**
   * Save a response to the database
   * @param responseData The response data to save
   * @param requestId The ID of the request this response belongs to
   * @returns Observable of the API response
   */
  saveResponse(responseData: any, requestId: number): Observable<any> {
    // Convert headers from array to dictionary format as required by the backend
    const headers: { [key: string]: string } = {};
    if (Array.isArray(responseData.headers)) {
      responseData.headers.forEach((header: any) => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
    }
    
    // Format the response according to the backend's CreateResponseDto
    const payload = {
      StatusCode: responseData.statusCode,
      StatusText: responseData.statusText || '',
      Headers: headers,
      ResponseTime: responseData.responseTime || 0,
      ResponseSize: responseData.responseSize || 0,
      Body: responseData.body || '',
      RequestId: requestId
    };
    
    return this.http.post<any>(`${this.baseUrl}/SaveResponse`, payload, this.getHttpOptions())
      .pipe(
        tap(response => {
          console.log('Response saved:', response);
        })
      );
  }

  /**
   * Get responses for a specific request
   * @param requestId The ID of the request to get responses for
   * @returns Observable of the API response containing an array of responses
   */
  getResponsesByRequestId(requestId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetResponsesByRequestId?id=${requestId}`, this.getHttpOptions())
      .pipe(
        tap(response => {
          console.log('Responses retrieved for request:', requestId, response);
        })
      );
  }
}
