import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {tap} from 'rxjs/operators';
import {CreateHistoryDto, HistoriesResponse, HistoryResponse} from '../models/history.model';


@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  // Subject to notify subscribers when histories change
  historiesChanged$ = new Subject<{action: string, id?: number}>();
  private baseUrl = 'http://localhost:5051';


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

  constructor(private http: HttpClient) {}

  SaveHistory(data: CreateHistoryDto): Observable<HistoryResponse> {
    const response = this.http.post<HistoryResponse>(`${this.baseUrl}/SaveHistory`, data, this.getHttpOptions());
    // Don't subscribe here - let the caller handle the subscription
    // This prevents double saving of history
    return response.pipe(
      tap(() => this.historiesChanged$.next({action: 'create'}))
    );
  }
  DeleteHistory(id: number): Observable<HistoryResponse> {
    const response = this.http.delete<HistoryResponse>(`${this.baseUrl}/DeleteHistory?id=${id}`, this.getHttpOptions());
    // Use tap operator instead of subscribing internally
    return response.pipe(
      tap(() => this.historiesChanged$.next({action: 'delete', id}))
    );
  }

  GetHistories(): Observable<HistoriesResponse> {
    return this.http.get<HistoriesResponse>(`${this.baseUrl}/GetHistories`, this.getHttpOptions());
  }

  /**
   * Get history items by workspace ID
   * @param workspaceId The ID of the workspace to get history for
   * @returns Observable of history response containing history items for the specified workspace
   */
  GetHistoryByWorkspaceId(workspaceId: number): Observable<HistoriesResponse> {
    return this.http.get<HistoriesResponse>(`${this.baseUrl}/GetHistoryByWorkspaceId?workspaceId=${workspaceId}`, this.getHttpOptions());
  }
  
  /**
   * Clear all history items for a workspace
   * @param workspaceId The ID of the workspace to clear history for
   * @returns Observable of history response
   */
  ClearHistories(workspaceId: number): Observable<HistoryResponse> {
    const response = this.http.delete<HistoryResponse>(`${this.baseUrl}/ClearHistories?workspaceId=${workspaceId}`, this.getHttpOptions());
    // Use tap operator instead of subscribing internally
    return response.pipe(
      tap(() => this.historiesChanged$.next({action: 'clear'}))
    );
  }
}
