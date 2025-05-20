import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpMethod } from '../models/http-method.enum';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private apiUrl = 'http://localhost:5051/PerformRequest'; // API endpoint from your

  constructor(private http: HttpClient) { }

  /**
   * Send an HTTP request based on the provided parameters
   */
  sendRequest(
    url: string,
    method: HttpMethod,
    headers: { key: string, value: string, description?: string, enabled: boolean }[],
    params: { key: string, value: string, description?: string, enabled: boolean }[],
    body?: any,
    auth?: any
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

    // Send the HTTP request
    return this.http.post<any>(this.apiUrl, requestPayload);
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
