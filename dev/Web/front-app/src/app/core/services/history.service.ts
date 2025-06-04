import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CreateHistoryDto, HistoriesResponse, HistoryResponse} from '../models/history.model';


@Injectable({
  providedIn: 'root'
})
export class HistoryService {
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
    return this.http.post<HistoryResponse>(`${this.baseUrl}/SaveHistory`, data, this.getHttpOptions());
  }
  DeleteHistory(id: number): Observable<HistoryResponse> {
    return this.http.delete<HistoryResponse>(`${this.baseUrl}/DeleteHistory?id=${id}`, this.getHttpOptions());
  }

  GetHistories(): Observable<HistoriesResponse> {
    return this.http.get<HistoriesResponse>(`${this.baseUrl}/GetHistories`, this.getHttpOptions());
  }
}
