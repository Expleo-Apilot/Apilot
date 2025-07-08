import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Collection } from '../models/collection.model';

/**
 * Service for importing collections from OpenAPI specifications
 * Handles both URL and file imports
 */
@Injectable({
  providedIn: 'root'
})
export class CollectionImportService {
  private readonly baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Import a collection from an OpenAPI specification URL
   * @param sourceUrl - URL pointing to an OpenAPI specification
   * @param workspaceId - ID of the workspace to import the collection into
   * @returns Observable of Collection
   */
  importFromUrl(sourceUrl: string, workspaceId: number): Observable<Collection> {
    const params = new HttpParams()
      .set('SourceUrl', sourceUrl)
      .set('WorkspaceId', workspaceId.toString());

    return this.http.post<ApiResponse<Collection>>(
      `${this.baseUrl}/ImportFromUrl`,
      null,
      { params }
    ).pipe(
      map(response => {
        if (response.success || response.isSuccess) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to import collection from URL');
      }),
      catchError(error => {
        console.error('Error importing collection from URL:', error);
        return throwError(() => new Error(error.message || 'Failed to import collection from URL'));
      })
    );
  }

  /**
   * Import a collection from an OpenAPI specification file
   * @param file - The OpenAPI specification file to import
   * @param workspaceId - ID of the workspace to import the collection into
   * @returns Observable of Collection
   */
  importFromFile(file: File, workspaceId: number): Observable<Collection> {
    const formData = new FormData();
    formData.append('File', file);
    
    const params = new HttpParams()
      .set('WorkspaceId', workspaceId.toString());

    return this.http.post<ApiResponse<Collection>>(
      `${this.baseUrl}/ImportFromFile`,
      formData,
      { params }
    ).pipe(
      map(response => {
        if (response.success || response.isSuccess) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to import collection from file');
      }),
      catchError(error => {
        console.error('Error importing collection from file:', error);
        return throwError(() => new Error(error.message || 'Failed to import collection from file'));
      })
    );
  }

  /**
   * Import a collection from a JSON string
   * @param jsonContent - JSON string containing collection data
   * @param workspaceId - ID of the workspace to import the collection into
   * @returns Observable of Collection
   */
  importFromJson(jsonContent: string, workspaceId: number): Observable<Collection> {
    const params = new HttpParams()
      .set('FileContent', jsonContent)
      .set('WorkspaceId', workspaceId.toString());

    return this.http.post<ApiResponse<Collection>>(
      `${this.baseUrl}/ImportFromUrl`,
      null,
      { params }
    ).pipe(
      map(response => {
        if (response.success || response.isSuccess) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to import collection from JSON');
      }),
      catchError(error => {
        console.error('Error importing collection from JSON:', error);
        return throwError(() => new Error(error.message || 'Failed to import collection from JSON'));
      })
    );
  }
}
