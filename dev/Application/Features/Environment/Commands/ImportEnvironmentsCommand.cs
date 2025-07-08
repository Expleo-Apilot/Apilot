using dev.Application.Common.Models;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Commands;

public record ImportEnvironmentsCommand : IRequest<Result<List<EnvironmentDto>>>
{
    public required ImportEnvironmentsRequest ImportRequest { get; init; }
}

public class ImportEnvironmentsCommandHandler : IRequestHandler<ImportEnvironmentsCommand, Result<List<EnvironmentDto>>>
{
    private readonly IEnvironmentService _environmentService;

    public ImportEnvironmentsCommandHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<List<EnvironmentDto>>> Handle(ImportEnvironmentsCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var importedEnvironments = new List<EnvironmentDto>();
            
            foreach (var envData in request.ImportRequest.Environments)
            {
                // Create a new environment for each imported environment
                var createRequest = new CreateEnvironmentRequest
                {
                    Name = envData.Name,
                    WorkSpaceId = request.ImportRequest.WorkspaceId
                };
                
                var environment = await _environmentService.CreateEnvironmentAsync(createRequest);
                
                // Add variables if they exist
                if (envData.Variables.Any())
                {
                    var addVariablesRequest = new AddVariablesToEnvironmentRequest
                    {
                        EnvironmentId = environment.Id,
                        Variables = envData.Variables
                    };
                    
                    await _environmentService.AddVariablesToEnvironmentAsync(addVariablesRequest);
                    
                    // Refresh the environment to get the updated variables
                    environment = await _environmentService.GetEnvironmentByIdAsync(environment.Id);
                }
                
                importedEnvironments.Add(environment);
            }
            
            return Result<List<EnvironmentDto>>.Success(importedEnvironments);
        }
        catch (Exception ex)
        {
            return Result<List<EnvironmentDto>>.Failure($"Failed to import environments: {ex.Message}");
        }
    }
}
