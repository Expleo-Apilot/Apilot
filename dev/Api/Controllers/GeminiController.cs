using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace dev.Api.Controllers
{
    [ApiController]
    [Route("api/gemini")]
    public class GeminiController : ControllerBase
    {
        private readonly ILogger<GeminiController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly string _geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models";
        private readonly string _defaultApiKey;
        private readonly string _defaultModel = "gemini-2.0-flash-lite";

        public GeminiController(ILogger<GeminiController> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            // Ensure we're using the correct API key
            _defaultApiKey = "AIzaSyBBDR43wevhWtK9S5PHG3gw-KQWk1q7lQk";
            _logger.LogInformation("GeminiController initialized");
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateContent([FromBody] GeminiRequest request, [FromHeader(Name = "Authorization")] string authorization = null)
        {
            try
            {
                // Always use the hardcoded API key for now to ensure it works
                var apiKey = _defaultApiKey;
                
                _logger.LogInformation($"Using Gemini API key");
                
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                
                // Log the request details for debugging
                _logger.LogInformation($"Received request with model: {request.Model}");
                _logger.LogInformation($"Prompt: {request.Prompt.Substring(0, Math.Min(50, request.Prompt.Length))}...");
                
                // Create the request payload for Gemini API
                var geminiRequest = new
                {
                    contents = new[] 
                    { 
                        new 
                        { 
                            role = "user", 
                            parts = new[]
                            {
                                new
                                {
                                    text = request.Prompt
                                }
                            }
                        } 
                    },
                    generationConfig = new
                    {
                        responseMimeType = "text/plain",
                        temperature = 0.7,
                        topK = 40,
                        topP = 0.95,
                        maxOutputTokens = 8192
                    }
                };
                
                _logger.LogInformation($"Sending request to Gemini API with model: {request.Model ?? _defaultModel}");

                var content = new StringContent(
                    JsonSerializer.Serialize(geminiRequest),
                    Encoding.UTF8,
                    "application/json");

                // Construct the URL with the API key as a query parameter
                var modelName = request.Model ?? _defaultModel;
                var endpoint = $"{_geminiApiUrl}/{modelName}:generateContent?key={apiKey}";
                _logger.LogInformation($"Sending request to Gemini API: {endpoint}");
                
                var response = await client.PostAsync(endpoint, content);
                
                // Log the complete response for debugging
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Response status code: {response.StatusCode}");
                _logger.LogInformation($"Response content: {responseContent.Substring(0, Math.Min(500, responseContent.Length))}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Gemini API returned error: {response.StatusCode}");
                    return StatusCode((int)response.StatusCode, responseContent);
                }

                // Use a try-catch block to handle potential JSON deserialization errors
                try
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(responseContent, options);
                    
                    if (geminiResponse.Candidates != null && geminiResponse.Candidates.Count > 0 &&
                        geminiResponse.Candidates[0].Content != null &&
                        geminiResponse.Candidates[0].Content.Parts != null &&
                        geminiResponse.Candidates[0].Content.Parts.Count > 0)
                    {
                        return Ok(new
                        {
                            response = geminiResponse.Candidates[0].Content.Parts[0].Text
                        });
                    }
                    else
                    {
                        _logger.LogError("Invalid response format from Gemini API");
                        return StatusCode(500, new { error = "Invalid response format from Gemini API" });
                    }
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(jsonEx, "Error deserializing Gemini API response");
                    return StatusCode(500, new { error = "Error processing the response from Gemini API", details = jsonEx.Message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Gemini API");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class GeminiRequest
    {
        [JsonPropertyName("prompt")]
        public string Prompt { get; set; }
        
        [JsonPropertyName("model")]
        public string Model { get; set; } = "gemini-2.0-flash-lite";
    }

    public class GeminiResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiCandidate> Candidates { get; set; }
        
        [JsonPropertyName("promptFeedback")]
        public GeminiPromptFeedback PromptFeedback { get; set; }
    }

    public class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent Content { get; set; }
        
        [JsonPropertyName("finishReason")]
        public string FinishReason { get; set; }
        
        [JsonPropertyName("index")]
        public int Index { get; set; }
        
        [JsonPropertyName("safetyRatings")]
        public List<GeminiSafetyRating> SafetyRatings { get; set; }
    }

    public class GeminiContent
    {
        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; }
        
        [JsonPropertyName("role")]
        public string Role { get; set; }
    }

    public class GeminiPart
    {
        [JsonPropertyName("text")]
        public string Text { get; set; }
    }

    public class GeminiSafetyRating
    {
        [JsonPropertyName("category")]
        public string Category { get; set; }
        
        [JsonPropertyName("probability")]
        public string Probability { get; set; }
    }

    public class GeminiPromptFeedback
    {
        [JsonPropertyName("safetyRatings")]
        public List<GeminiSafetyRating> SafetyRatings { get; set; }
    }
}
