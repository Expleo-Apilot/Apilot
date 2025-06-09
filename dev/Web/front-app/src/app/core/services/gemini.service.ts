import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LlmService, LlmResponse } from './llm.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// No need for custom interfaces as we're using the SDK

@Injectable({
  providedIn: 'root'
})
export class GeminiService implements LlmService {
  private apiKey = 'AIzaSyBYL5YCfX31ad1oQD3DHxkLYUz_nm7Wjz8'; // In production, use environment variables
  private modelName = 'gemini-1.5-pro';
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Generate text using the Gemini API
   * @param prompt The prompt to send to the model
   * @returns Observable with the response from the Gemini API
   */
  generateText(prompt: string): Observable<string> {
    try {
      // Get the model with configuration
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      });
      
      // Convert the Promise to an Observable
      return from(model.generateContent(prompt)).pipe(
        map(result => {
          // Extract text from response
          return result.response.text() || 'No response generated';
        }),
        catchError((error: any) => {
          console.error('Gemini API error:', error);
          return throwError(() => new Error(`Gemini API error: ${error?.message || 'Unknown error'}`));
        })
      );
    } catch (error: any) {
      console.error('Error initializing Gemini:', error);
      return throwError(() => new Error(`Error initializing Gemini: ${error?.message || 'Unknown error'}`));
    }
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

    return this.generateText(enhancedPrompt).pipe(
      map(response => ({ response }))
    );
  }
  
  /**
   * Get the name of the model being used
   * @returns The model name
   */
  getModelName(): string {
    return `Gemini (${this.modelName})`;
  }
}
