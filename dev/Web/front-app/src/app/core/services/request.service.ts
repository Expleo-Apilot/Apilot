import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Request } from '../models/request.model';

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

  constructor(private http: HttpClient) { }

  /**
   * Save a new request
   * @param request The request to save
   * @returns Observable of the API response containing the saved request
   */
  saveRequest(request: Partial<Request>): Observable<ApiResponse<Request>> {
    return this.http.post<ApiResponse<Request>>(`${this.baseUrl}/SaveRequest`, request);
  }

  /**
   * Get all requests
   * @returns Observable of the API response containing an array of requests
   */
  getRequests(): Observable<ApiResponse<Request[]>> {
    return this.http.get<ApiResponse<Request[]>>(`${this.baseUrl}/GetRequests`);
  }

  /**
   * Get a request by ID
   * @param id The ID of the request to retrieve
   * @returns Observable of the API response containing the request
   */
  getRequest(id: number): Observable<ApiResponse<Request>> {
    let params = new HttpParams().set('id', id.toString());
    return this.http.get<ApiResponse<Request>>(`${this.baseUrl}/GetRequest`, { params });
  }

  /**
   * Get requests by collection ID
   * @param collectionId The ID of the collection
   * @returns Observable of the API response containing an array of requests
   */
  getRequestsByCollectionId(collectionId: number): Observable<ApiResponse<Request[]>> {
    let params = new HttpParams().set('id', collectionId.toString());
    return this.http.get<ApiResponse<Request[]>>(`${this.baseUrl}/GetRequestsByCollectionId`, { params });
  }

  /**
   * Get requests by folder ID
   * @param folderId The ID of the folder
   * @returns Observable of the API response containing an array of requests
   */
  getRequestsByFolderId(folderId: number): Observable<ApiResponse<Request[]>> {
    let params = new HttpParams().set('id', folderId.toString());
    return this.http.get<ApiResponse<Request[]>>(`${this.baseUrl}/GetRequestsByFolderId`, { params });
  }

  /**
   * Update an existing request
   * @param request The request to update
   * @returns Observable of the API response
   */
  updateRequest(request: Partial<Request>): Observable<ApiResponse<{}>> {
    return this.http.put<ApiResponse<{}>>(`${this.baseUrl}/UpdateRequest`, request);
  }

  /**
   * Delete a request by ID
   * @param id The ID of the request to delete
   * @returns Observable of the API response
   */
  deleteRequest(id: number): Observable<ApiResponse<{}>> {
    let params = new HttpParams().set('id', id.toString());
    return this.http.delete<ApiResponse<{}>>(`${this.baseUrl}/DeleteRequest`, { params });
  }

  /**
   * Execute a request and get the response
   * @param request The request to execute
   * @returns Observable of the API response containing the execution result
   */
  executeRequest(request: Partial<Request>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ExecuteRequest`, request);
  }
}
