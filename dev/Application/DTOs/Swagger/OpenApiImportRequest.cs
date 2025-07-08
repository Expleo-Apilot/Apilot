namespace dev.Application.DTOs.Swagger;

public class OpenApiImportRequest
{
   public string SourceUrl { get; set; } = string.Empty;
   public string FileContent { get; set; } = string.Empty;
   public int WorkspaceId { get; set; }
}