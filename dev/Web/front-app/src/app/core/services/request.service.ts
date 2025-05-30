import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Request, CreateRequestDto } from '../models/request.model';

interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private baseUrl = environment.apiUrl || 'http://localhost:5051';
  
  // BehaviorSubject to notify subscribers when requests change
  private _requestsChanged = new BehaviorSubject<{action: string, data?: any}>({
    action: 'init'
  });
  
  // Observable that components can subscribe to
  public requestsChanged$ = this._requestsChanged.asObservable();

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });
  }

  private getHttpOptions() {
    return {
      headers: this.getAuthHeaders()
    };
  }

  /**
   * Save a new request
   * @param request The request to save
   * @returns Observable of the API response containing the saved request
   */
  saveRequest(request: CreateRequestDto): Observable<ApiResponse<Request>> {
    return this.http.post<ApiResponse<Request>>(`${this.baseUrl}/SaveRequest`, request, this.getHttpOptions())
      .pipe(
        tap(response => {
          if (response.isSuccess) {
            // Notify subscribers that a request has been created
            this._requestsChanged.next({
              action: 'create',
              data: response.data
            });
          }
        })
      );
  }

  /**
   * Get all requests
   * @returns Observable of the API response containing an array of requests
   */
  getRequests(): Observable<ApiResponse<Request[]>> {
    return this.http.get<ApiResponse<Request[]>>(`${this.baseUrl}/GetRequests`, this.getHttpOptions());
  }

  /**
   * Get a request by ID
   * @param id The ID of the request to retrieve
   * @returns Observable of the API response containing the request
   */
  getRequest(id: number): Observable<ApiResponse<Request>> {
    let params = new HttpParams().set('id', id.toString());
    return this.http.get<ApiResponse<Request>>(`${this.baseUrl}/GetRequest`, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get requests by collection ID
   * @param collectionId The ID of the collection
   * @returns Observable of the API response containing an array of requests
   */
  getRequestsByCollectionId(collectionId: number): Observable<ApiResponse<Request[]>> {
    let params = new HttpParams().set('id', collectionId.toString());
    return this.http.get<ApiResponse<Request[]>>(`${this.baseUrl}/GetRequestsByCollectionId`, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get requests by folder ID
   * @param folderId The ID of the folder
   * @returns Observable of the API response containing an array of requests
   */
  getRequestsByFolderId(folderId: number): Observable<ApiResponse<Request[]>> {
    let params = new HttpParams().set('id', folderId.toString());
    return this.http.get<ApiResponse<Request[]>>(`${this.baseUrl}/GetRequestsByFolderId`, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Update an existing request
   * @param request The request to update
   * @returns Observable of the API response
   */
  updateRequest(request: Partial<Request>): Observable<ApiResponse<{}>> {
    return this.http.put<ApiResponse<{}>>(`${this.baseUrl}/UpdateRequest`, request, this.getHttpOptions())
      .pipe(
        tap(response => {
          if (response.isSuccess) {
            // Notify subscribers that a request has been updated
            this._requestsChanged.next({
              action: 'update',
              data: request
            });
          }
        })
      );
  }

  /**
   * Delete a request by ID
   * @param id The ID of the request to delete
   * @returns Observable of the API response
   */
  deleteRequest(id: number): Observable<ApiResponse<{}>> {
    let params = new HttpParams().set('id', id.toString());
    return this.http.delete<ApiResponse<{}>>(`${this.baseUrl}/DeleteRequest`, { 
      params,
      headers: this.getAuthHeaders()
    })
    .pipe(
      tap(response => {
        if (response.isSuccess) {
          // Notify subscribers that a request has been deleted
          this._requestsChanged.next({
            action: 'delete',
            data: { id }
          });
        }
      })
    );
  }

  /**
   * Execute a request and get the response
   * @param request The request to execute
   * @returns Observable of the API response containing the execution result
   */
  executeRequest(request: Partial<Request>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ExecuteRequest`, request, this.getHttpOptions());
  }
}
