import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration: number;
}

export interface TestResponse {
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: TestResult[];
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TestRunnerService {
  private apiUrl = '/api/testrunner/run';
  private timeoutDuration = 30000; // 30 seconds timeout

  constructor(private http: HttpClient) { }

  /**
   * Runs C# test code on the backend
   * @param testCode The C# test code to execute
   * @returns Observable with test results
   */
  runTests(testCode: string): Observable<TestResponse> {
    return this.http.post<TestResponse>(this.apiUrl, { TestCode: testCode })
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  /**
   * Error handler for HTTP requests
   */
  private handleError(error: HttpErrorResponse | Error) {
    let errorMessage = 'Unknown error occurred';
    
    // Check if it's a timeout error
    if ('name' in error && error.name === 'TimeoutError') {
      errorMessage = 'Request timed out - the test execution took too long';
    }
    // Check if it's an HttpErrorResponse
    else if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client error: ${error.error.message}`;
      } else if (error.status === 0) {
        // Network error
        errorMessage = 'Network error - please check if the backend server is running';
      } else if (error.status === 408) {
        // HTTP timeout error
        errorMessage = 'Request timed out - the test execution took too long';
      } else {
        // Server-side error
        errorMessage = `Server error: ${error.status} ${error.statusText}\n${error.error?.message || ''}`;
      }
    }
    
    console.error('TestRunnerService error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
