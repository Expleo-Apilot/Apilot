using Apilot.Domain.Enums;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace dev.Infrastructure.Common;

public class SwaggerUtil
{
   
    public static string GenerateRequestName(string path)
    {
        return $"{path}";
    }
    
    public static string GenerateFullUrl(OpenApiDocument document, string path)
    {
        var server = document.Servers.FirstOrDefault();
        var baseUrl = server?.Url ?? string.Empty;

        if (server?.Variables != null)
        {
            foreach (var variable in server.Variables)
            {
                var value = variable.Value.Default ?? "";
                baseUrl = baseUrl.Replace($"{{{variable.Key}}}", value);
            }
        }

        var fullUrl = $"{baseUrl.TrimEnd('/')}/{path.TrimStart('/')}";
        return fullUrl;
    }

    public static ApiHttpMethod MapHttpMethod(OperationType operationType)
    {
        return operationType switch
        {
            OperationType.Get => ApiHttpMethod.GET,
            OperationType.Put => ApiHttpMethod.PUT,
            OperationType.Post => ApiHttpMethod.POST,
            OperationType.Delete => ApiHttpMethod.DELETE,
            OperationType.Options => ApiHttpMethod.OPTIONS,
            OperationType.Head => ApiHttpMethod.HEAD,
            OperationType.Patch => ApiHttpMethod.PATCH,
            _ => ApiHttpMethod.GET
        };
    }

    public static Dictionary<string, string> ExtractHeaders(OpenApiOperation operation)
    {
        var headers = new Dictionary<string, string>();

        if (operation.Parameters != null)
        {
            foreach (var param in operation.Parameters.Where(p => p.In == ParameterLocation.Header))
            {
                headers[param.Name] = param.Schema?.Default?.ToString() ?? "";
            }
        }

        return headers;
    }

    public static Dictionary<string, string> ExtractQueryParameters(OpenApiOperation operation)
    {
        var parameters = new Dictionary<string, string>();

        if (operation.Parameters != null)
        {
            foreach (var param in operation.Parameters.Where(p => p.In == ParameterLocation.Query))
            {
                parameters[param.Name] = param.Schema?.Default?.ToString() ?? "";
            }
        }

        return parameters;
    }

    public static string GenerateBodyFromSchema(OpenApiRequestBody requestBody)
    {
        if (requestBody == null || requestBody.Content.Count == 0)
            return null;

        var jsonContent = requestBody.Content.FirstOrDefault(c =>
            c.Key.Contains("application/json"));

        if (jsonContent.Value?.Schema != null)
        {
            var schemaAsJson = new JObject();
            GenerateJsonFromSchema(schemaAsJson, jsonContent.Value.Schema);
            return schemaAsJson.ToString(Formatting.Indented);
        }

        return null;
    }

    private static void GenerateJsonFromSchema(JObject jsonObject, OpenApiSchema schema)
    {
        if (schema.Properties != null)
        {
            foreach (var prop in schema.Properties)
            {
                switch (prop.Value.Type)
                {
                    case "string":
                        jsonObject[prop.Key] = prop.Value.Default?.ToString() ?? "";
                        break;
                    case "integer":
                        jsonObject[prop.Key] = prop.Value.Default?.ToString() != null
                            ? int.Parse(prop.Value.Default.ToString())
                            : 0;
                        break;
                    case "boolean":
                        jsonObject[prop.Key] = prop.Value.Default?.ToString() != null
                            ? bool.Parse(prop.Value.Default.ToString())
                            : false;
                        break;
                    case "object":
                        var nestedObject = new JObject();
                        GenerateJsonFromSchema(nestedObject, prop.Value);
                        jsonObject[prop.Key] = nestedObject;
                        break;
                    case "array":
                        jsonObject[prop.Key] = new JArray();
                        break;
                }
            }
        }
    }
    
    
    
}