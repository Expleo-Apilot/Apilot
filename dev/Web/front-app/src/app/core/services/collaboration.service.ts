import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  Collaboration,
  CreateCollaborationRequest,
  UpdateCollaborationStatusRequest
} from '../models/collaboration.model';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
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

  createCollaboration(request: CreateCollaborationRequest): Observable<ApiResponse<Collaboration>> {
    return this.http.post<ApiResponse<Collaboration>>(
      `${this.baseUrl}/api/collaboration`,
      request,
      this.getHttpOptions()
    ).pipe(
      map(response => ({
        ...response,
        isSuccess: response.success // Map success to isSuccess for backward compatibility
      }))
    );
  }


  getCollaborationsByCollectionId(collectionId: number): Observable<ApiResponse<Collaboration[]>> {
    return this.http.get<ApiResponse<Collaboration[]>>(
      `${this.baseUrl}/api/collaboration/collection/${collectionId}`,
      this.getHttpOptions()
    ).pipe(
      map(response => ({
        ...response,
        isSuccess: response.success // Map success to isSuccess for backward compatibility
      }))
    );
  }

  getCollaborationsForUser(): Observable<ApiResponse<Collaboration[]>> {
    return this.http.get<ApiResponse<Collaboration[]>>(
      `${this.baseUrl}/api/collaboration/user`,
      this.getHttpOptions()
    ).pipe(
      map(response => ({
        ...response,
        isSuccess: response.success // Map success to isSuccess for backward compatibility
      }))
    );
  }

  getPendingCollaborationsForUser(): Observable<ApiResponse<Collaboration[]>> {
    return this.http.get<ApiResponse<Collaboration[]>>(
      `${this.baseUrl}/api/collaboration/pending`,
      this.getHttpOptions()
    ).pipe(
      map(response => ({
        ...response,
        isSuccess: response.success // Map success to isSuccess for backward compatibility
      }))
    );
  }

  updateCollaborationStatus(request: UpdateCollaborationStatusRequest): Observable<ApiResponse<Collaboration>> {
    return this.http.put<ApiResponse<Collaboration>>(
      `${this.baseUrl}/api/collaboration/status`,
      request,
      this.getHttpOptions()
    ).pipe(
      map(response => ({
        ...response,
        isSuccess: response.success // Map success to isSuccess for backward compatibility
      }))
    );
  }

  deleteCollaboration(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/api/collaboration/${id}`,
      this.getHttpOptions()
    ).pipe(
      map(response => ({
        ...response,
        isSuccess: response.success // Map success to isSuccess for backward compatibility
      }))
    );
  }
}
