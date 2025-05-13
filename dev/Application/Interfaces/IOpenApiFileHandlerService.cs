using dev.Application.DTOs.Swagger;

namespace dev.Application.Interfaces;

public interface IOpenApiFileHandlerService
{
    Task<OpenApiImportRequest> ProcessUploadedFileAsync(OpenApiFileUploadRequest fileUploadRequest);

}