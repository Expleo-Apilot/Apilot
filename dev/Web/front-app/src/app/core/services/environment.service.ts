import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Environment,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
  AddVariableToEnvironmentRequest,
  UpdateVariableInEnvironmentRequest,
  AddVariablesToEnvironmentRequest,
  RemoveVariableFromEnvironmentRequest
} from '../models/environment.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private baseUrl = 'http://localhost:5051';

  constructor(private http: HttpClient) {}

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


  createEnvironment(request: CreateEnvironmentRequest): Observable<ApiResponse<Environment>> {
    return this.http.post<ApiResponse<Environment>>(
      `${this.baseUrl}/CreateEnvironment`,
      request,
      this.getHttpOptions()
    );
  }


  getAllEnvironments(): Observable<ApiResponse<Environment[]>> {
    return this.http.get<ApiResponse<Environment[]>>(
      `${this.baseUrl}/GetEnvironments`,
      this.getHttpOptions()
    );
  }


  getEnvironmentById(id: number): Observable<ApiResponse<Environment>> {
    return this.http.get<ApiResponse<Environment>>(
      `${this.baseUrl}/GetEnvironment`,
      {
        ...this.getHttpOptions(),
        params: { id: id.toString() }
      }
    );
  }

  getEnvironmentsByWorkspaceId(workspaceId: number): Observable<ApiResponse<Environment[]>> {
    return this.http.get<ApiResponse<Environment[]>>(
      `${this.baseUrl}/GetEnvironmentsByWorkspaceId`,
      {
        ...this.getHttpOptions(),
        params: { id: workspaceId.toString() }
      }
    );
  }


  updateEnvironment(request: UpdateEnvironmentRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/UpdateEnvironment`,
      request,
      this.getHttpOptions()
    );
  }


  deleteEnvironment(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/DeleteEnvironment`,
      {
        ...this.getHttpOptions(),
        params: { id: id.toString() }
      }
    );
  }


  addVariablesToEnvironment(request: AddVariablesToEnvironmentRequest): Observable<ApiResponse<Environment>> {
    return this.http.post<ApiResponse<Environment>>(
      `${this.baseUrl}/AddVariablesToEnvironment`,
      request,
      this.getHttpOptions()
    );
  }

  addVariableToEnvironment(request: AddVariableToEnvironmentRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.baseUrl}/AddVariableToEnvironment`,
      request,
      this.getHttpOptions()
    );
  }


  updateVariableInEnvironment(request: UpdateVariableInEnvironmentRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/UpdateVariableInEnvironment`,
      request,
      this.getHttpOptions()
    );
  }


  removeVariableFromEnvironment(request: RemoveVariableFromEnvironmentRequest): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/RemoveVariableFromEnvironment`,
      {
        ...this.getHttpOptions(),
        params: {
          environmentId: request.environmentId.toString(),
          key: request.key
        }
      }
    );
  }
}
