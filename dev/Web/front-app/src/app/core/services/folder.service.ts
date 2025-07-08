import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Folder, CreateFolderRequest, UpdateFolderRequest } from '../models/folder.model';
import { ApiResponse } from '../models/collection.model';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
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
   * Create a new folder
   * @param request Folder creation request data
   * @returns Observable of the created folder
   */
  createFolder(request: CreateFolderRequest): Observable<ApiResponse<Folder>> {
    return this.http.post<ApiResponse<Folder>>(`${this.baseUrl}/CreateFolder`, request, this.getHttpOptions());
  }

  /**
   * Get all folders
   * @returns Observable of all folders
   */
  getFolders(): Observable<ApiResponse<Folder[]>> {
    return this.http.get<ApiResponse<Folder[]>>(`${this.baseUrl}/GetFolders`, this.getHttpOptions());
  }

  /**
   * Get a folder by ID
   * @param id Folder ID
   * @returns Observable of the requested folder
   */
  getFolder(id: number): Observable<ApiResponse<Folder>> {
    return this.http.get<ApiResponse<Folder>>(`${this.baseUrl}/GetFolder`, {
      params: { id: id.toString() },
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get folders by collection ID
   * @param collectionId Collection ID
   * @returns Observable of folders belonging to the collection
   */
  getFoldersByCollectionId(collectionId: number): Observable<ApiResponse<Folder[]>> {
    return this.http.get<ApiResponse<Folder[]>>(`${this.baseUrl}/GetFoldersByCollectionId`, {
      params: { id: collectionId.toString() },
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Update an existing folder
   * @param request Folder update request data
   * @returns Observable of the update operation result
   */
  updateFolder(request: UpdateFolderRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/UpdateFolder`, request, this.getHttpOptions());
  }

  /**
   * Delete a folder by ID
   * @param id Folder ID to delete
   * @returns Observable of the delete operation result
   */
  deleteFolder(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/DeleteFolder`, {
      params: { id: id.toString() },
      headers: this.getAuthHeaders()
    });
  }
}
