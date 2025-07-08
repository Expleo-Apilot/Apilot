using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Swagger;

namespace dev.Application.Interfaces;

public interface IOpenApiImportService
{
    Task<CollectionDto> ImportOpenApiCollectionAsync(OpenApiImportRequest importRequest);
    Task<CollectionDto> ImportOpenApiFromFileAsync(OpenApiFileUploadRequest openApiFileUploadRequest);
    
}