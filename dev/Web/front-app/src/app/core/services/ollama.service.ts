import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LlmService, LlmResponse } from './llm.service';

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OllamaService implements LlmService {
  private apiUrl = 'http://localhost:11434/api/generate';
  private model = 'llama3';

  constructor(private http: HttpClient) { }

  /**
   * Generate text using the Ollama API
   * @param prompt The prompt to send to the model
   * @returns Observable with the response from the Ollama API
   */
  generateText(prompt: string): Observable<LlmResponse> {
    const request: OllamaRequest = {
      model: this.model,
      prompt: prompt,
      stream: false
    };

    return this.http.post<OllamaResponse>(this.apiUrl, request).pipe(
      map(response => ({ response: response.response }))
    );
  }

  /**
   * Generate test code based on a prompt
   * @param prompt The prompt describing the tests to generate
   * @returns Observable with the generated test code
   */
  generateTestCode(prompt: string): Observable<LlmResponse> {
    // Enhance the prompt to specifically generate C# test code
    const enhancedPrompt = `Generate C# test code for API testing. 
    The tests should use the Test() method and follow this format:
    
    Test("Test Name", () => {
        // Test code here
        var response = HttpClient.GetAsync("api/endpoint").Result;
        Assert.AreEqual(200, (int)response.StatusCode);
        // More assertions
    });
    
    Based on this request: "${prompt}"
    Only return the code, no explanations.`;

    return this.generateText(enhancedPrompt);
  }
  
  /**
   * Get the name of the model being used
   * @returns The model name
   */
  getModelName(): string {
    return `Ollama (${this.model})`;
  }
}
