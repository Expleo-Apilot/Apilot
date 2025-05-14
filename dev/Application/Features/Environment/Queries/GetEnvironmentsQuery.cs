using dev.Application.Common.Models;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Queries;

public record GetEnvironmentsQuery : IRequest<Result<List<EnvironmentDto>>>;


public class GetEnvironmentsQueryHandler : IRequestHandler<GetEnvironmentsQuery, Result<List<EnvironmentDto>>>
{
    
    private readonly IEnvironmentService _environmentService;

    public GetEnvironmentsQueryHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<List<EnvironmentDto>>> Handle(GetEnvironmentsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var environments = await _environmentService.GetAllEnvironmentsAsync();
            return Result<List<EnvironmentDto>>.Success(environments);
        }
        catch (Exception ex)
        {
            return Result<List<EnvironmentDto>>.Failure($"Failed to get environments: {ex.Message}");
        }
    }
}