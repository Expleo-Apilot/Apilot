import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Workspace } from '../models/workspace.model';

export interface WorkspaceCreateRequest {
  name: string;
  description: string;
}

export interface WorkspaceUpdateRequest {
  id: number;
  name?: string;
  description?: string;
}

export interface WorkspaceResponse {
  isSuccess: boolean;
  data: Workspace;
  error: string | null;
}

export interface WorkspacesResponse {
  isSuccess: boolean;
  data: Workspace[];
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private baseUrl = 'http://localhost:5051';

  constructor(private http: HttpClient) {}

  createWorkspace(data: WorkspaceCreateRequest): Observable<WorkspaceResponse> {
    return this.http.post<WorkspaceResponse>(`${this.baseUrl}/CreateWorkspace`, data);
  }

  updateWorkspace(data: WorkspaceUpdateRequest): Observable<WorkspaceResponse> {
    return this.http.put<WorkspaceResponse>(`${this.baseUrl}/UpdateWorkspace`, data);
  }

  deleteWorkspace(id: number): Observable<WorkspaceResponse> {
    return this.http.delete<WorkspaceResponse>(`${this.baseUrl}/DeleteWorkspace?id=${id}`);
  }

  getWorkspace(id: number): Observable<WorkspaceResponse> {
    return this.http.get<WorkspaceResponse>(`${this.baseUrl}/GetWorkspace?id=${id}`);
  }

  getWorkspaces(): Observable<WorkspacesResponse> {
    return this.http.get<WorkspacesResponse>(`${this.baseUrl}/GetWorkspaces`);
  }

  // Add methods for filter/list as needed
}
