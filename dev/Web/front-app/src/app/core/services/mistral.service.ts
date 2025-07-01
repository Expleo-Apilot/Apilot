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
8. Examples:

Example1:

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

example2;
TestAsync("Create and Update Order with Valid Token and Unique BookId", async () => {
try {
var token = "1f26a6a6f182ff37bdf0e90e21fddd927691045c48c40046da9490839f4dc2ea";
var client = ConfigureClient("https://simple-books-api.glitch.me", new Dictionary<string, string> {
{ "Authorization", $"Bearer {token}" }
});


    var orderBody = System.Text.Json.JsonSerializer.Serialize(new {
        bookId = 1,
        customerName = "Test User"
    });
    var content = new StringContent(orderBody, System.Text.Encoding.UTF8, "application/json");
    var createResponse = await client.PostAsync("/orders", content);
    AssertStatusCode(createResponse, HttpStatusCode.Created);
    var createJson = ParseJsonResponse(createResponse);
    var orderId = createJson.GetProperty("orderId").GetString();

    var patchBody = System.Text.Json.JsonSerializer.Serialize(new {
        customerName = "Updated User"
    });
    var patchContent = new StringContent(patchBody, System.Text.Encoding.UTF8, "application/json");
    var patchResponse = await client.PatchAsync($"/orders/{orderId}", patchContent);
    AssertStatusCode(patchResponse, HttpStatusCode.NoContent);
    return true;
} catch (Exception ex) {
    Assert(false, $"Test failed with error: {ex.Message}");
    return false;

 example3:
 TestAsync("Get List of Books", async () => {
try {
var client = ConfigureClient("https://simple-books-api.glitch.me", new Dictionary<string, string>());
var response = await client.GetAsync("/books");
AssertStatusCode(response, HttpStatusCode.OK);
var jsonResult = ParseJsonResponse(response);
Assert(jsonResult.GetArrayLength() > 0, "Books array should not be empty");
return true;
} catch (Exception ex) {
Assert(false, $"Test failed with error: {ex.Message}");
return false;
}
});
example4:
TestAsync("Register API Client", async () => {
try {
var client = ConfigureClient("https://simple-books-api.glitch.me", new Dictionary<string, string>());
var jsonBody = System.Text.Json.JsonSerializer.Serialize(new {
clientName = "SamirTestClient",
clientEmail = "samir@example.com"
});
var content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");
var response = await client.PostAsync("/api-clients", content);
AssertStatusCode(response, HttpStatusCode.Created);
var jsonResult = ParseJsonResponse(response);
Assert(jsonResult.TryGetProperty("accessToken", out var token) && token.GetString().Length > 0, "Token must be present");
return true;
} catch (Exception ex) {
Assert(false, $"Test failed with error: {ex.Message}");
return false;
}
});
Example5:

TestAsync("Mistral API Request", async () => {
    try {
        // Use the correct base URL without a trailing slash
        var client = ConfigureClient("https://api.mistral.ai", new Dictionary<string, string> {
            { "Authorization", "Bearer 2rYoaDl2VizSq6QmG2TvHEKw1QSFU4AM" },
            { "Accept", "application/json" }
        });

        var requestBody = new
        {
            model = "mistral-large-latest",
            messages = new[] {
                new {
                    role = "user",
                    content = "Create a test for Simple Books API status endpoint that verifies the status is OK"
                }
            }
        };

        var jsonBody = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");

        // Use the full path to the endpoint
        var response = await client.PostAsync("/v1/chat/completions", content);
        AssertStatusCode(response, System.Net.HttpStatusCode.OK);
        var jsonResult = ParseJsonResponse(response);
        Assert(jsonResult.GetProperty("choices").EnumerateArray().Any(), "Choices should not be empty");
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
Do not include explanations, comments, or markdown formatting. Output ONLY the pure C# code. Never prefix output with 'csharp' or any language identifier
Don't start with  prefix output with 'csharp' . Begin directly with the test script. No explanations, no extra text — just the code.
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
