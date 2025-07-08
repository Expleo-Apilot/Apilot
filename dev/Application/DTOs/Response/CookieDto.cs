namespace dev.Application.DTOs.Response;

public class CookieDto
{
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public Dictionary<string, string> Properties { get; set; } = new Dictionary<string, string>();
}