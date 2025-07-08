using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Xml;
using System.Xml.Serialization;
using Apilot.Domain.Enums;
using dev.Application.DTOs.AuthenticationDto;
using dev.Application.DTOs.Request;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using dev.Domain.Enums;

namespace dev.Infrastructure.Services;

public class PerformRequestService : IPerformRequestService
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions;

    public PerformRequestService(HttpClient httpClient)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };
    }

    public async Task<HttpResponseDto> GetAsync(PerformRequestDto request)
    {
        return await SendRequestAsync(request, HttpMethod.Get);
    }

    public async Task<HttpResponseDto> PostAsync(PerformRequestDto request)
    {
        return await SendRequestAsync(request, HttpMethod.Post);
    }

    public async Task<HttpResponseDto> PutAsync(PerformRequestDto request)
    {
        return await SendRequestAsync(request, HttpMethod.Put);
    }

    public async Task<HttpResponseDto> DeleteAsync(PerformRequestDto request)
    {
        return await SendRequestAsync(request, HttpMethod.Delete);
    }

    public async Task<HttpResponseDto> PatchAsync(PerformRequestDto request)
    {
        return await SendRequestAsync(request, HttpMethod.Patch);
    }

    private async Task<HttpResponseDto> SendRequestAsync(PerformRequestDto request, HttpMethod method)
    {
       
        var httpRequestMessage = CreateHttpRequestMessage(request, method);
        
        
        if (request.Authentication != null)
        {
            ApplyAuthentication(httpRequestMessage, request.Authentication);
        }

       
        if (request.Body != null && method != HttpMethod.Get)
        {
            string jsonContent = JsonSerializer.Serialize(request.Body, _jsonOptions);
            httpRequestMessage.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
        }

        
        var stopwatch = Stopwatch.StartNew();
        
        
        HttpResponseMessage response = await _httpClient.SendAsync(httpRequestMessage);
        
        stopwatch.Stop();
        
        
        return await ProcessResponseAsync(response, stopwatch.ElapsedMilliseconds);
    }

    private HttpRequestMessage CreateHttpRequestMessage(PerformRequestDto request, HttpMethod method)
    {
        var url = ApplyQueryParameters(request.Url, request.Parameters);
        
       // Console.WriteLine("**********************URL"+url);
        var httpRequestMessage = new HttpRequestMessage(method, url);
        
        foreach (var header in request.Headers)
        {
            httpRequestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }
        
        return httpRequestMessage;
    }

    private string ApplyQueryParameters(string baseUrl, Dictionary<string, string>? parameters)
    {
        if (parameters == null || !parameters.Any())
        {
            return baseUrl;
        }

        var uriBuilder = new UriBuilder(baseUrl);
        var query = string.Join("&", parameters.Select(p => $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value)}"));
        
        if (string.IsNullOrEmpty(uriBuilder.Query) || uriBuilder.Query == "?")
        {
            uriBuilder.Query = query;
        }
        else
        {
            var existingQuery = uriBuilder.Query.TrimStart('?');
            uriBuilder.Query = $"{existingQuery}&{query}";
        }

        return uriBuilder.Uri.ToString();
    }
   

    
    private void ApplyAuthentication(HttpRequestMessage request, AuthenticationDto authentication)
    {
        switch (authentication.AuthType)
        {
            case AuthType.Basic:
                if (authentication.AuthData.TryGetValue("username", out var username) && 
                    authentication.AuthData.TryGetValue("password", out var password))
                {
                    var credentialsBytes = Encoding.ASCII.GetBytes($"{username}:{password}");
                    var credentialsBase64 = Convert.ToBase64String(credentialsBytes);
                    request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentialsBase64);
                }
                break;
                
            case AuthType.Bearer:
                if (authentication.AuthData.TryGetValue("token", out var token))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }
                break;
                
            
                
        }
    }

    private async Task<HttpResponseDto> ProcessResponseAsync(HttpResponseMessage response, long responseTimeMs)
    {
       
        var headers = response.Headers
            .ToDictionary(h => h.Key, h => string.Join(", ", h.Value));
        
      
        if (response.Content?.Headers != null)
        {
            foreach (var header in response.Content.Headers)
            {
                headers[header.Key] = string.Join(", ", header.Value);
            }
        }
        
       
        var responseBodyBytes = await response.Content.ReadAsByteArrayAsync();
        var responseBody = await GetResponseBodyAsync(response);
        
        
        var cookies = ExtractCookies(response);
        
        return new HttpResponseDto
        {
            StatusCode = (int)response.StatusCode,
            StatusText = response.ReasonPhrase,
            Headers = headers,
            ResponseTime = (int)responseTimeMs,
            ResponseSize = responseBodyBytes.Length,
            Body = responseBody,
            Cookies = cookies
        };
    }

    private async Task<object> GetResponseBodyAsync(HttpResponseMessage response)
    {
        if (response.Content == null)
        {
            return string.Empty;
        }

        string contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        string responseBody = await response.Content.ReadAsStringAsync();

        
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return string.Empty;
        }

        try 
        {
            switch (contentType.ToLowerInvariant())
            {
                case string ct when ct.Contains("application/json"):
                    return TryParseJson(responseBody);

                case string ct when ct.Contains("application/xml") || ct.Contains("text/xml"):
                    return TryParseXml(responseBody);

                case string ct when ct.Contains("text/plain"):
                    return responseBody;

                case string ct when ct.Contains("application/x-www-form-urlencoded"):
                    return ParseFormUrlEncoded(responseBody);

                default:
                    return responseBody;
            }
        }
        catch
        {
            
            return responseBody;
        }
    }


    private ResponseCookiesDto ExtractCookies(HttpResponseMessage response)
    {
        var cookiesDto = new ResponseCookiesDto
        {
            Cookies = new List<CookieDto>()
        };
        
        if (response.Headers.TryGetValues("Set-Cookie", out var setCookieValues))
        {
            foreach (var cookieString in setCookieValues)
            {
                cookiesDto.Cookies.Add(ParseCookie(cookieString));
            }
        }
        
        return cookiesDto;
    }
    
    private CookieDto ParseCookie(string cookieString)
    {
        var parts = cookieString.Split(';');
        var nameValue = parts[0].Trim().Split('=');
        
        var cookieDto = new CookieDto
        {
            Name = nameValue[0],
            Value = nameValue.Length > 1 ? nameValue[1] : string.Empty,
            Properties = new Dictionary<string, string>()
        };
        
        for (int i = 1; i < parts.Length; i++)
        {
            var attributeParts = parts[i].Trim().Split('=');
            var attributeName = attributeParts[0].Trim();
            var attributeValue = attributeParts.Length > 1 ? attributeParts[1].Trim() : string.Empty;
            
            cookieDto.Properties[attributeName] = attributeValue;
        }
        
        return cookieDto;
    }
    
    
    
    // handle content type
    
    
   private object TryParseJson(string jsonString)
    {
        try 
        {
            var jsonElement = JsonSerializer.Deserialize<JsonElement>(jsonString, _jsonOptions);
            return jsonElement.ValueKind != JsonValueKind.Undefined ? jsonElement : (object)jsonString;
        }
        catch
        {
            return jsonString;
        }
    }

    private object TryParseXml(string xmlString)
    {
        try 
        {
            
            var xmlDoc = new XmlDocument();
            xmlDoc.LoadXml(xmlString);
            
            return ConvertXmlToObject(xmlDoc.DocumentElement);
        }
        catch
        {
            return xmlString;
        }
    }

    private object ConvertXmlToObject(XmlElement element)
    {
        
        var dict = new Dictionary<string, object>();
        
       
        foreach (XmlAttribute attr in element.Attributes)
        {
            dict[$"@{attr.Name}"] = attr.Value;
        }
        
       
        foreach (XmlElement childElement in element.ChildNodes.OfType<XmlElement>())
        {
            if (dict.ContainsKey(childElement.Name))
            {
               
                if (dict[childElement.Name] is List<object> list)
                {
                    list.Add(ConvertXmlToObject(childElement));
                }
                else
                {
                    dict[childElement.Name] = new List<object> 
                    { 
                        dict[childElement.Name], 
                        ConvertXmlToObject(childElement) 
                    };
                }
            }
            else
            {
                dict[childElement.Name] = ConvertXmlToObject(childElement);
            }
        }
        
        
        if (element.ChildNodes.OfType<XmlText>().Any())
        {
            dict["#text"] = element.InnerText.Trim();
        }
        
        return dict;
    }

    private Dictionary<string, string> ParseFormUrlEncoded(string formData)
    {
        return formData.Split('&')
            .Select(part => part.Split('='))
            .Where(parts => parts.Length > 0)
            .ToDictionary(
                parts => Uri.UnescapeDataString(parts[0]), 
                parts => parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty
            );
    }

}
