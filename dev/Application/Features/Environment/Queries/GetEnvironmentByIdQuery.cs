using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Queries;

public class GetEnvironmentByIdQuery : IRequest<Result<EnvironmentDto>>
{
    public required int Id { get; init; }
}

public class GetEnvironmentByIdQueryHandler : IRequestHandler<GetEnvironmentByIdQuery, Result<EnvironmentDto>>
{
    
    private readonly IEnvironmentService _environmentService;

    public GetEnvironmentByIdQueryHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<EnvironmentDto>> Handle(GetEnvironmentByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var environment = await _environmentService.GetEnvironmentByIdAsync(request.Id);
            return Result<EnvironmentDto>.Success(environment);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<EnvironmentDto>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<EnvironmentDto>.Failure($"Failed to get environment: {ex.Message}");
        }
    }
}