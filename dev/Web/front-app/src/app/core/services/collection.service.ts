import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, Collection, CreateCollectionRequest, UpdateCollectionRequest } from '../models/collection.model';
import { CollaborationStatus } from '../models/collaboration.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private baseUrl = 'http://localhost:5051';

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
   * Create a new collection
   * @param request Collection creation request data
   * @returns Observable of the created collection
   */
  createCollection(request: CreateCollectionRequest): Observable<ApiResponse<Collection>> {
    return this.http.post<ApiResponse<Collection>>(`${this.baseUrl}/CreateCollection`, request, this.getHttpOptions());
  }

  /**
   * Get all collections
   * @returns Observable of all collections
   */
  getCollections(): Observable<ApiResponse<Collection[]>> {
    return this.http.get<ApiResponse<Collection[]>>(`${this.baseUrl}/GetCollections`, this.getHttpOptions());
  }

  /**
   * Get a collection by ID
   * @param id Collection ID
   * @returns Observable of the requested collection
   */
  getCollection(id: number): Observable<ApiResponse<Collection>> {
    return this.http.get<ApiResponse<Collection>>(`${this.baseUrl}/GetCollection`, {
      params: { id: id.toString() },
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get collections by workspace ID
   * @param workspaceId Workspace ID
   * @returns Observable of collections belonging to the workspace
   */
  getCollectionsByWorkspaceId(workspaceId: number): Observable<ApiResponse<Collection[]>> {
    return this.http.get<ApiResponse<Collection[]>>(`${this.baseUrl}/GetCollectionsByWorkspaceId`, {
      params: { id: workspaceId.toString() },
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Update an existing collection
   * @param request Collection update request data
   * @returns Observable of the update operation result
   */
  updateCollection(request: UpdateCollectionRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/UpdateCollection`, request, this.getHttpOptions());
  }

  /**
   * Delete a collection by ID
   * @param id Collection ID to delete
   * @returns Observable of the delete operation result
   */
  deleteCollection(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/DeleteCollection`, {
      params: { id: id.toString() },
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get collections that the user has been invited to and accepted
   * @returns Observable of shared collections
   */
  getSharedCollections(): Observable<ApiResponse<Collection[]>> {
    return this.http.get<ApiResponse<Collection[]>>(
      `${this.baseUrl}/api/collection/shared`,
      this.getHttpOptions()
    ).pipe(
      map(response => {
        // Transform the response to ensure backward compatibility
        return {
          ...response,
          isSuccess: response.success,
          error: response.message || null,
          data: response.data?.map(collection => ({
            ...collection,
            isShared: true // Mark collections as shared
          })) || []
        };
      })
    );
  }
}
