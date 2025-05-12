using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Queries;

public class GetEnvironmentsByWorkspaceIdQuery : IRequest<Result<List<EnvironmentDto>>>
{
    public required int WorkspaceId { get; init; }
}


public class GetEnvironmentsByWorkspaceIdQueryHandler : IRequestHandler<GetEnvironmentsByWorkspaceIdQuery, Result<List<EnvironmentDto>>>
{
    
    private readonly IEnvironmentService _environmentService;

    public GetEnvironmentsByWorkspaceIdQueryHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<List<EnvironmentDto>>> Handle(GetEnvironmentsByWorkspaceIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var environments = await _environmentService.GetEnvironmentsByWorkspaceIdAsync(request.WorkspaceId);
            return Result<List<EnvironmentDto>>.Success(environments);
        }
        catch (Exception ex)
        {
            return Result<List<EnvironmentDto>>.Failure($"Failed to get environments: {ex.Message}");
        }
    }
}