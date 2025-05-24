import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Collection, CreateCollectionRequest, UpdateCollectionRequest } from '../models/collection.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private baseUrl = 'http://localhost:5051';

  constructor(private http: HttpClient) { }

  /**
   * Create a new collection
   * @param request Collection creation request data
   * @returns Observable of the created collection
   */
  createCollection(request: CreateCollectionRequest): Observable<ApiResponse<Collection>> {
    return this.http.post<ApiResponse<Collection>>(`${this.baseUrl}/CreateCollection`, request);
  }

  /**
   * Get all collections
   * @returns Observable of all collections
   */
  getCollections(): Observable<ApiResponse<Collection[]>> {
    return this.http.get<ApiResponse<Collection[]>>(`${this.baseUrl}/GetCollections`);
  }

  /**
   * Get a collection by ID
   * @param id Collection ID
   * @returns Observable of the requested collection
   */
  getCollection(id: number): Observable<ApiResponse<Collection>> {
    return this.http.get<ApiResponse<Collection>>(`${this.baseUrl}/GetCollection`, {
      params: { id: id.toString() }
    });
  }

  /**
   * Get collections by workspace ID
   * @param workspaceId Workspace ID
   * @returns Observable of collections belonging to the workspace
   */
  getCollectionsByWorkspaceId(workspaceId: number): Observable<ApiResponse<Collection[]>> {
    return this.http.get<ApiResponse<Collection[]>>(`${this.baseUrl}/GetCollectionsByWorkspaceId`, {
      params: { id: workspaceId.toString() }
    });
  }

  /**
   * Update an existing collection
   * @param request Collection update request data
   * @returns Observable of the update operation result
   */
  updateCollection(request: UpdateCollectionRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/UpdateCollection`, request);
  }

  /**
   * Delete a collection by ID
   * @param id Collection ID to delete
   * @returns Observable of the delete operation result
   */
  deleteCollection(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/DeleteCollection`, {
      params: { id: id.toString() }
    });
  }
}
