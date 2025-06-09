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
            sb.AppendLine("using System.Net.Http;");
            sb.AppendLine("using System.Threading.Tasks;");
            sb.AppendLine("using System.Diagnostics;");
            sb.AppendLine("using System.Text.Json;");
            sb.AppendLine("using System.Reflection;");
            sb.AppendLine("using System.Text;");
            
            // Add test framework
            sb.AppendLine("public class TestFramework {");
            sb.AppendLine("    public static List<TestResult> Results = new List<TestResult>();");
            sb.AppendLine("    public static HttpClient HttpClient = new HttpClient();");
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
            sb.AppendLine("            result.Message = ex.Message;");
            sb.AppendLine("        } finally {");
            sb.AppendLine("            stopwatch.Stop();");
            sb.AppendLine("            result.Duration = stopwatch.ElapsedMilliseconds;");
            sb.AppendLine("            Results.Add(result);");
            sb.AppendLine("        }");
            sb.AppendLine("    }");
            sb.AppendLine("    public static void Assert(bool condition, string message = null) {");
            sb.AppendLine("        if (!condition) throw new Exception(message ?? \"Assertion failed\");");
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
            sb.AppendLine("                Message = ex.Message,");
            sb.AppendLine("                Duration = 0");
            sb.AppendLine("            });");
            sb.AppendLine("        }");
            sb.AppendLine("        return TestFramework.Results;");
            sb.AppendLine("    }");
            
            // Add helper methods for the user's test code
            sb.AppendLine("    public static HttpClient GetClient() => TestFramework.HttpClient;");
            sb.AppendLine("    public static void Test(string name, Func<bool> testAction) => TestFramework.Test(name, testAction);");
            sb.AppendLine("    public static void Assert(bool condition, string message = null) => TestFramework.Assert(condition, message);");
            
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
                MetadataReference.CreateFromFile(typeof(Microsoft.CSharp.RuntimeBinder.CSharpArgumentInfo).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Collections.Generic.List<>).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Net.Http.HttpClient).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Linq.Enumerable).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Text.Json.JsonSerializer).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Diagnostics.Stopwatch).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(System.Threading.Tasks.Task).Assembly.Location)
            };

            // Add additional references as needed for your specific tests
            var systemRuntimePath = Path.Combine(Path.GetDirectoryName(typeof(object).Assembly.Location), "System.Runtime.dll");
            if (System.IO.File.Exists(systemRuntimePath))
            {
                references.Add(MetadataReference.CreateFromFile(systemRuntimePath));
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
