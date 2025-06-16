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
      stream: false,
      options: {
        temperature: 0.2,  // Lower temperature for more deterministic/focused output
        top_p: 0.9,        // Slightly constrained sampling for better code quality
        top_k: 40          // Limit token selection to improve coherence
      }
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
    // Enhance the prompt to specifically generate C# test code compatible with our test framework
    const enhancedPrompt = `Generate C# API test code using our custom test framework. Follow these guidelines exactly:

1. Use TestAsync for API calls (not Test) and always include the async/await pattern:

TestAsync("Descriptive Test Name", async () => {
    // Test code here with await for all async calls
    // Return true at the end if test passes
    return true;
});

2. Available helper methods:
   - ConfigureClient(baseUrl, headers, timeoutSeconds) - Creates an HttpClient
   - AssertStatusCode(response, HttpStatusCode.OK) - Checks exact status code
   - AssertStatusCodeRange(response, minCode, maxCode) - Checks status code in range
   - JsonPropertyExists(jsonElement, "propertyName") - Checks if property exists
   - JsonPropertyEquals(jsonElement, "propertyName", value) - Checks property value
   - ParseJsonResponse(response) - Returns JsonElement for JSON processing

3. For JSON handling, use System.Text.Json.JsonElement methods:
   - Access properties: jsonElement.TryGetProperty("name", out JsonElement prop)
   - Get values: prop.GetString(), prop.GetInt32(), etc.
   - Check array: jsonElement.ValueKind == JsonValueKind.Array
   - Iterate array: foreach (JsonElement item in jsonElement.EnumerateArray())

4. Always include proper error handling with try/catch blocks

5. API-specific information:
   - Simple Books API (https://simple-books-api.glitch.me) status endpoint returns: {"status":"OK"}
   - Books endpoint (/books) returns an array of book objects with properties: id, name, type, available
   - Authentication requires a POST to /api-clients with clientName and clientEmail

Example test for reference:

TestAsync("Verify User API", async () => {
    try {
        // Configure client with base URL and headers
        var client = ConfigureClient("https://api.example.com", new Dictionary<string, string> {
            { "Authorization", "Bearer token" }
        });
        
        // Make API request
        var response = await client.GetAsync("/users/1");
        
        // Verify status code
        AssertStatusCode(response, HttpStatusCode.OK);
        
        // Parse and verify JSON response
        var jsonResult = ParseJsonResponse(response);
        Assert(JsonPropertyExists(jsonResult, "name"), "User should have name property");
        Assert(JsonPropertyEquals(jsonResult, "active", true), "User should be active");
        
        return true;
    } catch (Exception ex) {
        Assert(false, $"Test failed with error: {ex.Message}");
        return false;
    }
});

Based on this request: "${prompt}"
Generate ONLY the test code, no explanations or markdown formatting.`;

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
