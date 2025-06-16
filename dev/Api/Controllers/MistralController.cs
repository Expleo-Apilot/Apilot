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
    [Route("api/mistral")]
    public class MistralController : ControllerBase
    {
        private readonly ILogger<MistralController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly string _mistralApiUrl = "https://api.mistral.ai/v1/chat/completions";
        private readonly string _defaultApiKey;

        public MistralController(ILogger<MistralController> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            // Ensure we're using the correct API key format
            _defaultApiKey = "2rYoaDl2VizSq6QmG2TvHEKw1QSFU4AM";
            _logger.LogInformation("MistralController initialized");
        }

        [HttpPost("chat/completions")]
        public async Task<IActionResult> ChatCompletions([FromBody] MistralRequest request, [FromHeader(Name = "Authorization")] string authorization = null)
        {
            try
            {
                // Always use the hardcoded API key for now to ensure it works
                var apiKey = _defaultApiKey;
                
                _logger.LogInformation($"Using Mistral API key");
                
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                // Log the request details for debugging
                _logger.LogInformation($"Received request with model: {request.Model}");
                _logger.LogInformation($"Prompt: {request.Prompt.Substring(0, Math.Min(50, request.Prompt.Length))}...");
                
                // Create the request payload for Mistral API
                var mistralRequest = new
                {
                    model = request.Model ?? "mistral-large-latest",
                    messages = new[] 
                    { 
                        new 
                        { 
                            role = "user", 
                            content = request.Prompt 
                        } 
                    }
                };
                
                _logger.LogInformation($"Sending request to Mistral API with model: {mistralRequest.model}");

                var content = new StringContent(
                    JsonSerializer.Serialize(mistralRequest),
                    Encoding.UTF8,
                    "application/json");

                _logger.LogInformation($"Sending request to Mistral API: {_mistralApiUrl}");
                var response = await client.PostAsync(_mistralApiUrl, content);
                
                // Log the complete response for debugging
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Response status code: {response.StatusCode}");
                _logger.LogInformation($"Response content: {responseContent.Substring(0, Math.Min(500, responseContent.Length))}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Mistral API returned error: {response.StatusCode}");
                    return StatusCode((int)response.StatusCode, responseContent);
                }

                // Use a try-catch block to handle potential JSON deserialization errors
                try
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var mistralResponse = JsonSerializer.Deserialize<MistralResponse>(responseContent, options);
                    
                    return Ok(new
                    {
                        response = mistralResponse.Choices[0].Message.Content
                    });
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(jsonEx, "Error deserializing Mistral API response");
                    return StatusCode(500, new { error = "Error processing the response from Mistral API", details = jsonEx.Message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Mistral API");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class MistralRequest
    {
        [JsonPropertyName("prompt")]
        public string Prompt { get; set; }
        
        [JsonPropertyName("model")]
        public string Model { get; set; } = "mistral-large-latest";
    }

    public class MistralResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }
        
        [JsonPropertyName("object")]
        public string Object { get; set; }
        
        [JsonPropertyName("created")]
        public long Created { get; set; }
        
        [JsonPropertyName("model")]
        public string Model { get; set; }
        
        [JsonPropertyName("choices")]
        public List<MistralChoice> Choices { get; set; }
        
        [JsonPropertyName("usage")]
        public MistralUsage Usage { get; set; }
    }

    public class MistralChoice
    {
        [JsonPropertyName("index")]
        public int Index { get; set; }
        
        [JsonPropertyName("message")]
        public MistralMessage Message { get; set; }
        
        [JsonPropertyName("finish_reason")]
        public string FinishReason { get; set; }
    }

    public class MistralMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; }
        
        [JsonPropertyName("content")]
        public string Content { get; set; }
        
        [JsonPropertyName("tool_calls")]
        public object ToolCalls { get; set; }
    }

    public class MistralUsage
    {
        [JsonPropertyName("prompt_tokens")]
        public int PromptTokens { get; set; }
        
        [JsonPropertyName("completion_tokens")]
        public int CompletionTokens { get; set; }
        
        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }
    }
}
