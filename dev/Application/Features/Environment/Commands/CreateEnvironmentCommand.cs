using dev.Application.Common.Models;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Commands;

public record CreateEnvironmentCommand : IRequest<Result<EnvironmentDto>>
{
    public required CreateEnvironmentDto EnvironmentDto { get; init; }
}


public class CreateEnvironmentCommandHandler : IRequestHandler<CreateEnvironmentCommand, Result<EnvironmentDto>>
{
    
    private readonly IEnvironmentService _environmentService;

    public CreateEnvironmentCommandHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<EnvironmentDto>> Handle(CreateEnvironmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var environment = await _environmentService.CreateEnvironmentAsync(request.EnvironmentDto);
            return Result<EnvironmentDto>.Success(environment);
        }
        catch (Exception ex)
        {
            return Result<EnvironmentDto>.Failure($"Failed to create environment: {ex.Message}");
        }
    }
}