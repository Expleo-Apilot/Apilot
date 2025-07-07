import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, first, switchMap } from 'rxjs/operators';
import { API_BASE_URL } from '../../constants';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from '../models/history/history-request.model';
import { VariableReplacementService } from './variable-replacement.service';
import { Authentication, KeyValuePair } from '../models/request.model';
import { HttpMethod } from '../models/http-method.enum';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private apiUrl = 'http://localhost:5051/PerformRequest'; // API endpoint from your

  constructor(
    private http: HttpClient,
    private historyService: HistoryService,
    private variableReplacementService: VariableReplacementService
  ) { }

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
    workspaceId : number  = 0,
    bodyType: string = 'json'
  ): Observable<any> {
    // Replace variables in the URL using the {{variableName}} syntax
    // Pass isUrl=true so that variable replacement knows to handle URL variables differently
    const processedUrl = this.variableReplacementService.replaceVariables(url, true);
    console.log('URL after variable replacement:', processedUrl);
    
    // Process headers - replace variables in both keys and values
    const processedHeaders = this.processKeyValuePairsWithVariables(headers.filter(h => h.enabled));
    
    // Process parameters - replace variables in both keys and values
    const processedParams = this.processKeyValuePairsWithVariables(params.filter(p => p.enabled));
    
    // Process body - replace variables in the request body if it's a string or object
    let processedBody = body;
    if (body) {
      processedBody = this.variableReplacementService.replaceVariablesInObject(body);
    }
    
    // Process authentication if present
    let processedAuth = auth;
    if (auth) {
      processedAuth = this.variableReplacementService.replaceVariablesInObject(auth);
    }
    
    // Convert the processed headers and params arrays to dictionary format expected by the backend
    const headersDict = this.convertArrayToDictionary(processedHeaders);
    const paramsDict = this.convertArrayToDictionary(processedParams);

    // Prepare the request payload according to the PerformRequestDto format
    const requestPayload = {
      httpMethod: method,
      url: processedUrl,
      headers: headersDict,
      parameters: paramsDict,
      body: processedBody,
      authentication: processedAuth
    };
    
    // Log the processed request for debugging
    console.log('Processed request with variables replaced:', {
      url: processedUrl,
      headers: headersDict,
      params: paramsDict,
      body: processedBody
    });

    // Save the request to history before sending
    if (workspaceId > 0) {
      // Create history data with the correct HTTP method
      const historyData: CreateHistoryDto = {
        timeStamp: new Date(),
        workSpaceId: workspaceId,
        Requests: {
          method: method, // Match the PerformRequestDto interface which expects 'method' not 'httpMethod'
          httpMethod: method, // Add httpMethod property for display in the UI
          url: processedUrl, // Save the processed URL with replaced variables
          headers: headersDict,
          params: paramsDict,
          body: processedBody,
          bodyType: bodyType
        }
      };
      
      // Save to history - use first() to complete the observable after first emission
      // This prevents duplicate history saving since we're not subscribing here
      return this.historyService.SaveHistory(historyData).pipe(
        first(),
        switchMap((response: any) => {
          console.log('Request saved to history successfully', response);
          // Now send the actual HTTP request
          return this.performHttpRequest(processedUrl, method, headersDict, paramsDict, processedBody);
        }),
        catchError((error: any) => {
          console.error('Error saving request to history', error);
          // Still proceed with the HTTP request even if history saving fails
          return this.performHttpRequest(processedUrl, method, headersDict, paramsDict, processedBody);
        })
      );
    }

    // For requests that don't need to be saved to history
    return this.performHttpRequest(processedUrl, method, headersDict, paramsDict, processedBody);
  }

  /**
   * Performs the actual HTTP request after history has been saved
   * @param url Processed URL with variables replaced
   * @param method HTTP method to use
   * @param headers Processed headers with variables replaced
   * @param params Processed parameters with variables replaced
   * @param body Processed body with variables replaced
   * @returns Observable of the HTTP response
   */
  private performHttpRequest(
    url: string,
    method: HttpMethod,
    headers: Record<string, string>,
    params: Record<string, string>,
    body?: any
  ): Observable<any> {
    // Create the request payload
    const requestPayload = {
      url: url,
      method: method,
      headers: headers,
      parameters: params,
      body: body
    };
    
    // Send the HTTP request with authorization header and processed data
    return this.http.post<any>(this.apiUrl, requestPayload, this.getHttpOptions());
  }

  /**
   * Process key-value pairs by replacing variables in both keys and values
   * @param array Array of key-value pairs to process
   * @returns Processed array with variables replaced
   */
  private processKeyValuePairsWithVariables(
    array: { key: string, value: string, description?: string, enabled: boolean }[]
  ): { key: string, value: string, description?: string, enabled: boolean }[] {
    return array.map(item => {
      return {
        key: this.variableReplacementService.replaceVariables(item.key),
        value: this.variableReplacementService.replaceVariables(item.value || ''),
        description: item.description,
        enabled: item.enabled
      };
    });
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
