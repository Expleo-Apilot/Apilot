using dev.Application.DTOs.Environment;
using dev.Application.Features.Environment.Commands;
using dev.Application.Features.Environment.Queries;
using dev.Application.Services.CurrentUser;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[ApiController]
[Route("")]
[Authorize]
public class EnvironmentController : ControllerBase
{
    
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public EnvironmentController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }

    [HttpPost("/CreateEnvironment")]
    public async Task<IActionResult> CreateEnvironment([FromBody] CreateEnvironmentRequest request)
    {
        var cmd = new CreateEnvironmentCommand
        {
            EnvironmentRequest = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpPut("/UpdateEnvironment")]
    public async Task<IActionResult> UpdateEnvironment([FromBody] UpdateEnvironmentRequest request)
    {
        var cmd = new UpdateEnvironmentCommand
        {
            EnvironmentRequest = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpDelete("/DeleteEnvironment")]
    public async Task<IActionResult> DeleteEnvironment([FromQuery] int id)
    {
        var cmd = new DeleteEnvironmentCommand { Id = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetEnvironments")]
    public async Task<IActionResult> GetAll()
    {
        var cmd = new GetEnvironmentsQuery();
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetEnvironment")]
    public async Task<IActionResult> GetEnvironment([FromQuery] int id)
    {
        var cmd = new GetEnvironmentByIdQuery{ Id = id};
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetEnvironmentsByWorkspaceId")]
    public async Task<IActionResult> GetEnvironmentsByWorkspaceId([FromQuery] int id)
    {
        var cmd = new GetEnvironmentsByWorkspaceIdQuery
        {
            WorkspaceId = id
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }


    [HttpPost("/AddVariablesToEnvironment")]
    public async Task<IActionResult> AddVariablesToEnvironment([FromBody] AddVariablesToEnvironmentRequest request)
    {
        var cmd = new AddVariablesToEnvironmentCommand
        {
            Environment = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpPost("/AddVariableToEnvironment")]
    public async Task<IActionResult> AddVariableToEnvironment([FromBody] AddVariableToEnvironmentRequest request)
    {
        var cmd = new AddVariableToEnvironmentCommand
        {
            EnvironmentRequest = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpPut("/UpdateVariableInEnvironment")]
    public async Task<IActionResult> UpdateVariableInEnvironment([FromBody] UpdateVariableInEnvironmentRequest request)
    {
        var cmd = new UpdateVariableInEnvironmentCommand
        {
            EnvironmentRequest = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }


    [HttpDelete("/RemoveVariableFromEnvironment")]
    public async Task<IActionResult> RemoveVariableFromEnvironment([FromBody] RemoveVariableFromEnvironmentRequest request)
    {
        var cmd = new RemoveVariableFromEnvironmentCommand
        {
            Command = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
}