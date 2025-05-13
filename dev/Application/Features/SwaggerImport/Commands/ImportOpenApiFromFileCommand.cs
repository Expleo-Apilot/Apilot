using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Swagger;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.SwaggerImport.Commands;

public record ImportOpenApiFromFileCommand : IRequest<Result<CollectionDto>>
{
    public required OpenApiFileUploadRequest Request { get; init; }
}



public class ImportOpenApiFromFileCommandHandler : IRequestHandler<ImportOpenApiFromFileCommand, Result<CollectionDto>>
{
    
    private readonly IOpenApiImportService _importService;

    public ImportOpenApiFromFileCommandHandler(IOpenApiImportService importService)
    {
        _importService = importService;
    }

    
    public async Task<Result<CollectionDto>> Handle(ImportOpenApiFromFileCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var collection = await _importService.ImportOpenApiFromFileAsync(request.Request);
            return Result<CollectionDto>.Success(collection);
        }
        catch (Exception ex)
        {
            return Result<CollectionDto>.Failure($"Failed to import file: {ex.Message}");
        }
    }
}