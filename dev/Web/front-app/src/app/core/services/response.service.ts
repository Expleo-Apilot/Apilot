import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  private responseDataSubject = new BehaviorSubject<any>(null);
  public responseData$: Observable<any> = this.responseDataSubject.asObservable();

  constructor() { }
  
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
   * Update the response data that will be shared with the ResponseAreaComponent
   */
  updateResponseData(data: any): void {
    this.responseDataSubject.next(data);
  }

  /**
   * Clear the response data
   */
  clearResponseData(): void {
    this.responseDataSubject.next(null);
  }
}
