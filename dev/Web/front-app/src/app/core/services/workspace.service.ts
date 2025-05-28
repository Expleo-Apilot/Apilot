import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
/*import { Workspace } from '../models/workspace.model';*/
import {WorkspaceCreateRequest} from '../models/workspace.model';
import {WorkspaceUpdateRequest} from '../models/workspace.model';
import {WorkspaceResponse} from '../models/workspace.model';
import {WorkspacesResponse} from '../models/workspace.model';



@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
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

  createWorkspace(data: WorkspaceCreateRequest): Observable<WorkspaceResponse> {
    return this.http.post<WorkspaceResponse>(`${this.baseUrl}/CreateWorkspace`, data, this.getHttpOptions());
  }

  updateWorkspace(data: WorkspaceUpdateRequest): Observable<WorkspaceResponse> {
    return this.http.put<WorkspaceResponse>(`${this.baseUrl}/UpdateWorkspace`, data, this.getHttpOptions());
  }

  deleteWorkspace(id: number): Observable<WorkspaceResponse> {
    return this.http.delete<WorkspaceResponse>(`${this.baseUrl}/DeleteWorkspace?id=${id}`, this.getHttpOptions());
  }

  getWorkspace(id: number): Observable<WorkspaceResponse> {
    return this.http.get<WorkspaceResponse>(`${this.baseUrl}/GetWorkspace?id=${id}`, this.getHttpOptions());
  }

  getWorkspaces(): Observable<WorkspacesResponse> {
    return this.http.get<WorkspacesResponse>(`${this.baseUrl}/GetWorkspaces`, this.getHttpOptions());
  }
}
