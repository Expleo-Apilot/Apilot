using dev.Application.Common.Models;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Commands;

public record AddVariablesToEnvironmentCommand : IRequest<Result<EnvironmentDto>>
{
    public required AddVariablesToEnvironmentRequest Environment { get; init; }
}


public class AddVariablesToEnvironmentCommandHandler : IRequestHandler<AddVariablesToEnvironmentCommand, Result<EnvironmentDto>>
{
    
    private readonly IEnvironmentService _environmentService;

    public AddVariablesToEnvironmentCommandHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<EnvironmentDto>> Handle(AddVariablesToEnvironmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var environment = await _environmentService.AddVariablesToEnvironment(request.Environment);
            return Result<EnvironmentDto>.Success(environment);
        }
        catch (Exception ex)
        {
            return Result<EnvironmentDto>.Failure($"Failed to add variables to  environment: {ex.Message}");
        }
    }
}