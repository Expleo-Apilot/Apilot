using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Emit;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text;
using System.Threading.Tasks;

namespace Apilot.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestRunnerController : ControllerBase
    {
        private readonly ILogger<TestRunnerController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public TestRunnerController(ILogger<TestRunnerController> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public class TestRequest
        {
            public string TestCode { get; set; }
        }

        public class TestResult
        {
            public string Name { get; set; }
            public bool Passed { get; set; }
            public string Message { get; set; }
            public long Duration { get; set; }
        }

        public class TestResponse
        {
            public List<TestResult> Results { get; set; } = new List<TestResult>();
            public bool Success { get; set; }
            public string ErrorMessage { get; set; }
            public int TotalTests { get; set; }
            public int PassedTests { get; set; }
        }

        [HttpPost("run")]
        public async Task<ActionResult<TestResponse>> RunTests([FromBody] TestRequest request)
        {
            if (string.IsNullOrEmpty(request.TestCode))
            {
                return BadRequest(new TestResponse
                {
                    Success = false,
                    ErrorMessage = "Test code cannot be empty"
                });
            }

            var response = new TestResponse();

            try
            {
                // Add necessary references and usings to the test code
                var completeCode = GenerateCompleteTestCode(request.TestCode);

                // Compile the test code
                var assembly = CompileCode(completeCode);
                if (assembly == null)
                {
                    return BadRequest(new TestResponse
                    {
                        Success = false,
                        ErrorMessage = "Failed to compile test code"
                    });
                }

                // Execute the tests
                response = await ExecuteTests(assembly);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running tests");
                response.Success = false;
                response.ErrorMessage = $"Error: {ex.Message}";
            }

            return Ok(response);
        }

        private string GenerateCompleteTestCode(string userCode)
        {
            var sb = new StringBuilder();

            // Add necessary using statements
            sb.AppendLine("using System;");
            sb.AppendLine("using System.Collections.Generic;");
            sb.AppendLine("using System.Linq;");
            sb.AppendLine("using System.Net;");
            sb.AppendLine("using System.Net.Http;");
            sb.AppendLine("using System.Net.Http.Headers;");
            sb.AppendLine("using System.Threading.Tasks;");
            sb.AppendLine("using System.Diagnostics;");
            sb.AppendLine("using System.Text.Json;");
            sb.AppendLine("using System.Text.Json.Serialization;");
            sb.AppendLine("using System.Reflection;");
            sb.AppendLine("using System.Text;");
            sb.AppendLine("using System.IO;");
            sb.AppendLine("using System.Threading;");
            
            // Add test framework
            sb.AppendLine("public class TestFramework {");
            sb.AppendLine("    public static List<TestResult> Results = new List<TestResult>();");
            sb.AppendLine("    public static HttpClient HttpClient = new HttpClient() { Timeout = TimeSpan.FromSeconds(30) };");
            
            // Test function for synchronous tests
            sb.AppendLine("    public static void Test(string name, Func<bool> testAction) {");
            sb.AppendLine("        var result = new TestResult { Name = name };");
            sb.AppendLine("        var stopwatch = Stopwatch.StartNew();");
            sb.AppendLine("        try {");
            sb.AppendLine("            result.Passed = testAction();");
            sb.AppendLine("            if (!result.Passed) {");
            sb.AppendLine("                result.Message = \"Test assertion failed\";");
            sb.AppendLine("            }");
            sb.AppendLine("        } catch (Exception ex) {");
            sb.AppendLine("            result.Passed = false;");
            sb.AppendLine("            result.Message = ex.ToString();");
            sb.AppendLine("        } finally {");
            sb.AppendLine("            stopwatch.Stop();");
            sb.AppendLine("            result.Duration = stopwatch.ElapsedMilliseconds;");
            sb.AppendLine("            Results.Add(result);");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            
            // Test function for asynchronous tests (for API calls)
            sb.AppendLine("    public static void TestAsync(string name, Func<Task<bool>> testAction) {");
            sb.AppendLine("        var result = new TestResult { Name = name };");
            sb.AppendLine("        var stopwatch = Stopwatch.StartNew();");
            sb.AppendLine("        try {");
            sb.AppendLine("            result.Passed = testAction().GetAwaiter().GetResult();");
            sb.AppendLine("            if (!result.Passed) {");
            sb.AppendLine("                result.Message = \"Test assertion failed\";");
            sb.AppendLine("            }");
            sb.AppendLine("        } catch (Exception ex) {");
            sb.AppendLine("            result.Passed = false;");
            sb.AppendLine("            if (ex is AggregateException aggregateEx) {");
            sb.AppendLine("                result.Message = string.Join(\"\\n\", aggregateEx.InnerExceptions.Select(e => e.ToString()));");
            sb.AppendLine("            } else {");
            sb.AppendLine("                result.Message = ex.ToString();");
            sb.AppendLine("            }");
            sb.AppendLine("        } finally {");
            sb.AppendLine("            stopwatch.Stop();");
            sb.AppendLine("            result.Duration = stopwatch.ElapsedMilliseconds;");
            sb.AppendLine("            Results.Add(result);");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            
            // Basic assertion
            sb.AppendLine("    public static void Assert(bool condition, string message = null) {");
            sb.AppendLine("        if (!condition) throw new Exception(message ?? \"Assertion failed\");");
            sb.AppendLine("    }");
            
            // API response validation helpers
            sb.AppendLine("    public static void AssertStatusCode(HttpResponseMessage response, HttpStatusCode expectedCode) {");
            sb.AppendLine("        if (response.StatusCode != expectedCode) {");
            sb.AppendLine("            throw new Exception($\"Expected status code {expectedCode} but got {response.StatusCode}. Response: {response.Content.ReadAsStringAsync().GetAwaiter().GetResult()}\");");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static void AssertStatusCodeRange(HttpResponseMessage response, int minCode, int maxCode) {");
            sb.AppendLine("        int statusCode = (int)response.StatusCode;");
            sb.AppendLine("        if (statusCode < minCode || statusCode > maxCode) {");
            sb.AppendLine("            throw new Exception($\"Expected status code between {minCode}-{maxCode} but got {statusCode}. Response: {response.Content.ReadAsStringAsync().GetAwaiter().GetResult()}\");");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static void AssertContentType(HttpResponseMessage response, string expectedContentType) {");
            sb.AppendLine("        string contentType = response.Content.Headers.ContentType?.MediaType;");
            sb.AppendLine("        if (contentType == null || !contentType.Contains(expectedContentType)) {");
            sb.AppendLine("            throw new Exception($\"Expected content type containing '{expectedContentType}' but got '{contentType}'\");");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static T ParseJsonResponse<T>(HttpResponseMessage response) {");
            sb.AppendLine("        var content = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();");
            sb.AppendLine("        return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static JsonElement ParseJsonResponse(HttpResponseMessage response) {");
            sb.AppendLine("        var content = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();");
            sb.AppendLine("        return JsonSerializer.Deserialize<JsonElement>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static bool JsonPropertyEquals(JsonElement element, string propertyName, string expectedValue) {");
            sb.AppendLine("        if (element.TryGetProperty(propertyName, out JsonElement property)) {");
            sb.AppendLine("            if (property.ValueKind == JsonValueKind.String) {");
            sb.AppendLine("                return property.GetString() == expectedValue;");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine("        return false;");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static bool JsonPropertyEquals(JsonElement element, string propertyName, int expectedValue) {");
            sb.AppendLine("        if (element.TryGetProperty(propertyName, out JsonElement property)) {");
            sb.AppendLine("            if (property.ValueKind == JsonValueKind.Number) {");
            sb.AppendLine("                return property.GetInt32() == expectedValue;");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine("        return false;");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static bool JsonPropertyEquals(JsonElement element, string propertyName, bool expectedValue) {");
            sb.AppendLine("        if (element.TryGetProperty(propertyName, out JsonElement property)) {");
            sb.AppendLine("            if (property.ValueKind == JsonValueKind.True || property.ValueKind == JsonValueKind.False) {");
            sb.AppendLine("                return property.GetBoolean() == expectedValue;");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine("        return false;");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static bool JsonPropertyExists(JsonElement element, string propertyName) {");
            sb.AppendLine("        return element.TryGetProperty(propertyName, out _);");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static JsonElement GetNestedJsonProperty(JsonElement element, string path) {");
            sb.AppendLine("        string[] parts = path.Split('.');");
            sb.AppendLine("        JsonElement current = element;");
            
            sb.AppendLine("        foreach (string part in parts) {");
            sb.AppendLine("            if (!current.TryGetProperty(part, out current)) {");
            sb.AppendLine("                throw new Exception($\"Could not find property '{part}' in path '{path}'\");");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            
            sb.AppendLine("        return current;");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static bool JsonArrayContains(JsonElement arrayElement, string propertyName, string searchValue) {");
            sb.AppendLine("        if (arrayElement.ValueKind != JsonValueKind.Array) {");
            sb.AppendLine("            throw new Exception(\"The provided JsonElement is not an array\");");
            sb.AppendLine("        }");
            
            sb.AppendLine("        foreach (JsonElement item in arrayElement.EnumerateArray()) {");
            sb.AppendLine("            if (item.TryGetProperty(propertyName, out JsonElement property) && ");
            sb.AppendLine("                property.ValueKind == JsonValueKind.String && ");
            sb.AppendLine("                property.GetString() == searchValue) {");
            sb.AppendLine("                return true;");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            
            sb.AppendLine("        return false;");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static void AssertResponseContains(HttpResponseMessage response, string expectedText) {");
            sb.AppendLine("        string content = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();");
            sb.AppendLine("        if (!content.Contains(expectedText)) {");
            sb.AppendLine("            throw new Exception($\"Expected response to contain '{expectedText}' but it did not. Response: {content}\");");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static void AssertResponseTime(long milliseconds, long maxAcceptableMs) {");
            sb.AppendLine("        if (milliseconds > maxAcceptableMs) {");
            sb.AppendLine("            throw new Exception($\"Response time {milliseconds}ms exceeded maximum acceptable time {maxAcceptableMs}ms\");");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            
            sb.AppendLine("    public static HttpClient ConfigureClient(string baseUrl = null, Dictionary<string, string> headers = null, int timeoutSeconds = 30) {");
            sb.AppendLine("        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(timeoutSeconds) };");
            sb.AppendLine("        if (!string.IsNullOrEmpty(baseUrl)) {");
            sb.AppendLine("            client.BaseAddress = new Uri(baseUrl);");
            sb.AppendLine("        }");
            sb.AppendLine("        if (headers != null) {");
            sb.AppendLine("            foreach (var header in headers) {");
            sb.AppendLine("                client.DefaultRequestHeaders.Add(header.Key, header.Value);");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
            sb.AppendLine("        return client;");
            sb.AppendLine("    }");
            
            sb.AppendLine("}");
            
            // Add TestResult class
            sb.AppendLine("public class TestResult {");
            sb.AppendLine("    public string Name { get; set; }");
            sb.AppendLine("    public bool Passed { get; set; }");
            sb.AppendLine("    public string Message { get; set; }");
            sb.AppendLine("    public long Duration { get; set; }");
            sb.AppendLine("}");
            
            // Add the main test class
            sb.AppendLine("public class TestRunner {");
            sb.AppendLine("    public static List<TestResult> RunTests() {");
            sb.AppendLine("        try {");
            sb.AppendLine("            Run();");
            sb.AppendLine("        } catch (Exception ex) {");
            sb.AppendLine("            TestFramework.Results.Add(new TestResult {");
            sb.AppendLine("                Name = \"Test Execution Error\",");
            sb.AppendLine("                Passed = false,");
            sb.AppendLine("                Message = ex.ToString(),");
            sb.AppendLine("                Duration = 0");
            sb.AppendLine("            });");
            sb.AppendLine("        }");
            sb.AppendLine("        return TestFramework.Results;");
            sb.AppendLine("    }");
            
            // Add helper methods for the user's test code
            sb.AppendLine("    public static HttpClient GetClient() => TestFramework.HttpClient;");
            sb.AppendLine("    public static void Test(string name, Func<bool> testAction) => TestFramework.Test(name, testAction);");
            sb.AppendLine("    public static void TestAsync(string name, Func<Task<bool>> testAction) => TestFramework.TestAsync(name, testAction);");
            sb.AppendLine("    public static void Assert(bool condition, string message = null) => TestFramework.Assert(condition, message);");
            sb.AppendLine("    public static HttpClient ConfigureClient(string baseUrl, Dictionary<string, string> headers = null, int timeoutSeconds = 30) => TestFramework.ConfigureClient(baseUrl, headers, timeoutSeconds);");
            sb.AppendLine("    public static void AssertStatusCode(HttpResponseMessage response, HttpStatusCode expectedStatusCode) => TestFramework.AssertStatusCode(response, expectedStatusCode);");
            sb.AppendLine("    public static void AssertStatusCodeRange(HttpResponseMessage response, int minStatusCode, int maxStatusCode) => TestFramework.AssertStatusCodeRange(response, minStatusCode, maxStatusCode);");
            sb.AppendLine("    public static void AssertContentType(HttpResponseMessage response, string expectedContentType) => TestFramework.AssertContentType(response, expectedContentType);");
            sb.AppendLine("    public static void AssertResponseContains(HttpResponseMessage response, string expectedText) => TestFramework.AssertResponseContains(response, expectedText);");
            sb.AppendLine("    public static T ParseJsonResponse<T>(HttpResponseMessage response) => TestFramework.ParseJsonResponse<T>(response);");
            sb.AppendLine("    public static JsonElement ParseJsonResponse(HttpResponseMessage response) => TestFramework.ParseJsonResponse(response);");
            sb.AppendLine("    public static bool JsonPropertyEquals(JsonElement element, string propertyName, string expectedValue) => TestFramework.JsonPropertyEquals(element, propertyName, expectedValue);");
            sb.AppendLine("    public static bool JsonPropertyEquals(JsonElement element, string propertyName, int expectedValue) => TestFramework.JsonPropertyEquals(element, propertyName, expectedValue);");
            sb.AppendLine("    public static bool JsonPropertyEquals(JsonElement element, string propertyName, bool expectedValue) => TestFramework.JsonPropertyEquals(element, propertyName, expectedValue);");
            sb.AppendLine("    public static bool JsonPropertyExists(JsonElement element, string propertyName) => TestFramework.JsonPropertyExists(element, propertyName);");
            sb.AppendLine("    public static void AssertResponseTime(long actualMs, long maxExpectedMs) => TestFramework.AssertResponseTime(actualMs, maxExpectedMs);");
            
            // Add the user's test code
            sb.AppendLine("    public static void Run() {");
            sb.AppendLine(userCode);
            sb.AppendLine("    }");
            sb.AppendLine("}");

            return sb.ToString();
        }

        private Assembly CompileCode(string sourceCode)
        {
            var syntaxTree = CSharpSyntaxTree.ParseText(sourceCode);

            string assemblyName = Path.GetRandomFileName();
            var references = new List<MetadataReference>
            {
                MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(Console).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Runtime.AssemblyTargetedPatchBandAttribute).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Collections.Generic.List<>).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Net.Http.HttpClient).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Linq.Enumerable).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Text.Json.JsonSerializer).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Diagnostics.Stopwatch).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Threading.Tasks.Task).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Net.HttpStatusCode).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(Uri).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Net.Http.Headers.HttpRequestHeaders).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.IO.Stream).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Threading.CancellationToken).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(Microsoft.CSharp.RuntimeBinder.CSharpArgumentInfo).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(Microsoft.CSharp.RuntimeBinder.Binder).Assembly.Location),
                MetadataReference.CreateFromFile(Path.Combine(Path.GetDirectoryName(typeof(object).Assembly.Location), "Microsoft.CSharp.dll"))
            };

            // Add additional references as needed for your specific tests
            var systemRuntimePath = Path.Combine(Path.GetDirectoryName(typeof(object).Assembly.Location), "System.Runtime.dll");
            if (System.IO.File.Exists(systemRuntimePath))
            {
                references.Add(MetadataReference.CreateFromFile(systemRuntimePath));
            }
            
            // Add System.Private.Uri reference
            var systemPrivateUriPath = Path.Combine(Path.GetDirectoryName(typeof(Uri).Assembly.Location), "System.Private.Uri.dll");
            if (System.IO.File.Exists(systemPrivateUriPath))
            {
                references.Add(MetadataReference.CreateFromFile(systemPrivateUriPath));
            }
            
            // Add System.Net.Http.Json reference
            var systemNetHttpJsonPath = Path.Combine(Path.GetDirectoryName(typeof(System.Net.Http.HttpClient).Assembly.Location), "System.Net.Http.Json.dll");
            if (System.IO.File.Exists(systemNetHttpJsonPath))
            {
                references.Add(MetadataReference.CreateFromFile(systemNetHttpJsonPath));
            }
            
            // Add System.Text.Json reference
            var systemTextJsonPath = Path.Combine(Path.GetDirectoryName(typeof(System.Text.Json.JsonSerializer).Assembly.Location), "System.Text.Json.dll");
            if (System.IO.File.Exists(systemTextJsonPath))
            {
                references.Add(MetadataReference.CreateFromFile(systemTextJsonPath));
            }

            var compilation = CSharpCompilation.Create(
                assemblyName,
                syntaxTrees: new[] { syntaxTree },
                references: references,
                options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

            using var ms = new MemoryStream();
            EmitResult result = compilation.Emit(ms);

            if (!result.Success)
            {
                var failures = result.Diagnostics.Where(diagnostic =>
                    diagnostic.IsWarningAsError ||
                    diagnostic.Severity == DiagnosticSeverity.Error);

                foreach (var diagnostic in failures)
                {
                    _logger.LogError("{0}: {1}", diagnostic.Id, diagnostic.GetMessage());
                }

                return null;
            }

            ms.Seek(0, SeekOrigin.Begin);
            return AssemblyLoadContext.Default.LoadFromStream(ms);
        }

        private async Task<TestResponse> ExecuteTests(Assembly assembly)
        {
            var response = new TestResponse();

            try
            {
                var testRunnerType = assembly.GetType("TestRunner");
                var runTestsMethod = testRunnerType.GetMethod("RunTests", BindingFlags.Public | BindingFlags.Static);
                
                // Get the results from the dynamic assembly
                var dynamicResults = runTestsMethod.Invoke(null, null);
                
                // Convert the dynamic results to our TestResult type using reflection
                var results = new List<TestResult>();
                var resultsList = (System.Collections.IEnumerable)dynamicResults;
                
                foreach (var item in resultsList)
                {
                    var itemType = item.GetType();
                    var name = itemType.GetProperty("Name")?.GetValue(item) as string;
                    var passed = (bool)(itemType.GetProperty("Passed")?.GetValue(item) ?? false);
                    var message = itemType.GetProperty("Message")?.GetValue(item) as string;
                    var duration = Convert.ToInt64(itemType.GetProperty("Duration")?.GetValue(item) ?? 0);
                    
                    results.Add(new TestResult
                    {
                        Name = name,
                        Passed = passed,
                        Message = message,
                        Duration = duration
                    });
                }
                
                response.Results = results;
                response.Success = true;
                response.TotalTests = results.Count;
                response.PassedTests = results.Count(r => r.Passed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing tests");
                response.Success = false;
                response.ErrorMessage = $"Error executing tests: {ex.Message}";
            }

            return response;
        }
    }
}
