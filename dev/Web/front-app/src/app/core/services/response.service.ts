import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  private responseDataSubject = new BehaviorSubject<any>(null);
  public responseData$: Observable<any> = this.responseDataSubject.asObservable();

  constructor() { }

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
