using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Swagger;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.SwaggerImport.Commands;

public record ImportOpenApiCollectionCommand : IRequest<Result<CollectionDto>>
{
    public required OpenApiImportRequest Request { get; init; }
}



public class ImportOpenApiCollectionCommandHandler : IRequestHandler<ImportOpenApiCollectionCommand, Result<CollectionDto>>
{
    private readonly IOpenApiImportService _importService;

    public ImportOpenApiCollectionCommandHandler(IOpenApiImportService importService)
    {
        _importService = importService;
    }

    public async Task<Result<CollectionDto>> Handle(ImportOpenApiCollectionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var collection = await _importService.ImportOpenApiCollectionAsync(request.Request);
            return Result<CollectionDto>.Success(collection);
        }
        catch (Exception ex)
        {
            return Result<CollectionDto>.Failure($"Failed to import collection: {ex.Message}");
        }
    }
}