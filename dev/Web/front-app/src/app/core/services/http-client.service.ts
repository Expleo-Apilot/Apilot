import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpMethod } from '../models/http-method.enum';
import {HistoryService} from './history.service';
import {CreateHistoryDto, PerformRequestDto} from '../models/history.model';
import {Authentication, KeyValuePair} from '../models/request.model';
import {ActivatedRoute} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private apiUrl = 'http://localhost:5051/PerformRequest'; // API endpoint from your

  constructor(private http: HttpClient ,
              private historyService: HistoryService ) { }

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
   * Send an HTTP request based on the provided parameters
   */
  sendRequest(
    url: string,
    method: HttpMethod,
    headers: { key: string, value: string, description?: string, enabled: boolean }[],
    params: { key: string, value: string, description?: string, enabled: boolean }[],
    body?: any,
    auth?: any,
    workspaceId : number  = 0
  ): Observable<any> {
    // Convert the headers array to a dictionary format expected by the backend
    const headersDict = this.convertArrayToDictionary(
      headers.filter(h => h.enabled)
    );

    // Convert the params array to a dictionary format expected by the backend
    const paramsDict = this.convertArrayToDictionary(
      params.filter(p => p.enabled)
    );

    // Prepare the request payload according to the PerformRequestDto format
    const requestPayload = {
      httpMethod: method,
      url: url,
      headers: headersDict,
      parameters: paramsDict,
      body: body,
      authentication: auth
    };

    let createHistory : CreateHistoryDto = {
      timeStamp: new Date(),
      workSpaceId: workspaceId,
      Requests : {
        method: method,
        url: url,
        params: paramsDict,
        headers: headersDict,
        authentication : auth,
        body : body
      }
    }
    this.historyService.SaveHistory(createHistory).subscribe({
      next : (data) => {
        console.log(data);
      },
      error : (error) => {
        console.log(error);
      }
    })

    // Send the HTTP request with authorization header
    return this.http.post<any>(this.apiUrl, requestPayload, this.getHttpOptions());
  }

  /**
   * Convert array of key-value pairs to dictionary
   */
  private convertArrayToDictionary(
    array: { key: string, value: string, description?: string, enabled: boolean }[]
  ): Record<string, string> {
    const dict: Record<string, string> = {};

    array.forEach(item => {
      if (item.key) {
        dict[item.key] = item.value || '';
      }
    });

    return dict;
  }
}
