using System.Net;

namespace dev.Application.DTOs.Response;

public class HttpResponseDto
{
    public int StatusCode { get; set; }
    public string? StatusText { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();
    public int ResponseTime { get; set; }
    public int ResponseSize { get; set; }
    public object? Body { get; set; }
    public ResponseCookiesDto Cookies { get; set; } = null!;

}