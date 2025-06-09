import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface LlmResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export abstract class LlmService {
  /**
   * Generate test code based on a prompt
   * @param prompt The prompt describing the tests to generate
   * @returns Observable with the generated test code
   */
  abstract generateTestCode(prompt: string): Observable<LlmResponse>;
  
  /**
   * Get the name of the model being used
   * @returns The model name
   */
  abstract getModelName(): string;
}
