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
  private timeoutDuration = 30000;

  constructor(private http: HttpClient) { }

  runTests(testCode: string): Observable<TestResponse> {
    return this.http.post<TestResponse>(this.apiUrl, { TestCode: testCode })
      .pipe(
        timeout(this.timeoutDuration),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse | Error) {
    let errorMessage = 'Unknown error occurred';
    
    if ('name' in error && error.name === 'TimeoutError') {
      errorMessage = 'Request timed out - the test execution took too long';
    }
    else if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Client error: ${error.error.message}`;
      } else if (error.status === 0) {
        errorMessage = 'Network error - please check if the backend server is running';
      } else if (error.status === 408) {
        errorMessage = 'Request timed out - the test execution took too long';
      } else {
        errorMessage = `Server error: ${error.status} ${error.statusText}\n${error.error?.message || ''}`;
      }
    }
    
    console.error('TestRunnerService error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
