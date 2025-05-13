namespace dev.Application.DTOs.Swagger;

public class OpenApiFileUploadRequest
{
    public required IFormFile File { get; set; }
    public int WorkspaceId { get; set; }
}