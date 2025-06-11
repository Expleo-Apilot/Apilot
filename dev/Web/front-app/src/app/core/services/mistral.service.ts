import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LlmService, LlmResponse } from './llm.service';

export interface MistralRequest {
  model: string;
  prompt: string;
}

export interface MistralResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class MistralService implements LlmService {
  private apiUrl = '/api/mistral/chat/completions';
  private model = 'mistral-large-latest';

  constructor(private http: HttpClient) { }

  /**
   * Generate text using the Mistral API
   * @param prompt The prompt to send to the model
   * @returns Observable with the response from the Mistral API
   */
  generateText(prompt: string): Observable<LlmResponse> {
    const request: MistralRequest = {
      model: this.model,
      prompt: prompt
    };

    // Add headers for the request
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<MistralResponse>(this.apiUrl, request, { headers }).pipe(
      map(response => ({ response: response.response }))
    );
  }

  /**
   * Generate test code based on a prompt
   * @param prompt The prompt describing the tests to generate
   * @returns Observable with the generated test code
   */
  generateTestCode(prompt: string): Observable<LlmResponse> {
    // Enhanced prompt for Mistral to generate code compatible with our dynamic test runner
    const enhancedPrompt = `You are generating C# test code for an ASP.NET Core test runner that dynamically compiles and executes tests. Follow these rules:

1. Use TestAsync("Test Name", async () => { ... }) for all API tests. Always use async/await for HTTP calls.
2. Use ConfigureClient(baseUrl, headers, timeoutSeconds) to create the HttpClient for requests.
3. Use the following helpers for assertions and JSON:
   - AssertStatusCode(response, expectedStatusCode)
   - Assert(responseCondition, message)
   - ParseJsonResponse(response) to parse JSON
   - JsonPropertyEquals(jsonElement, propertyName, value) to check JSON properties
4. Do NOT use TestFramework.HttpClient directly or raw System.Text.Json APIs.
5. Each test must return true at the end if it passes.
6. Use try/catch for error handling inside the test lambda.
7. Do not include explanations, comments, or markdown formatting. Output ONLY the C# code.
8. Example:

TestAsync("Verify Simple Books API Status", async () => {
    try {
        var client = ConfigureClient("https://simple-books-api.glitch.me", new Dictionary<string, string>());
        var response = await client.GetAsync("/status");
        AssertStatusCode(response, HttpStatusCode.OK);
        var jsonResult = ParseJsonResponse(response);
        Assert(JsonPropertyEquals(jsonResult, "status", "OK"), "Status should be OK");
        return true;
    } catch (Exception ex) {
        Assert(false, $"Test failed with error: {ex.Message}");
        return false;
    }
});

9. API-specific information:
   - Simple Books API (https://simple-books-api.glitch.me) status endpoint returns: {"status":"OK"}
   - Books endpoint (/books) returns an array of book objects with properties: id, name, type, available
   - Authentication requires a POST to /api-clients with clientName and clientEmail

Based on this request: "${prompt}"
Generate ONLY the C# test code.`;

    return this.generateText(enhancedPrompt);
  }

  /**
   * Get the name of the model being used
   * @returns The model name
   */
  getModelName(): string {
    return `Mistral (${this.model})`;
  }
}
