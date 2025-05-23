using dev.Application.DTOs.Workspace;
using dev.Application.Features.Workspace.Commands;
using dev.Application.Features.Workspace.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[ApiController]
[Route("")]
public class WorkspaceController : ControllerBase
{
    private readonly IMediator _mediator;

    public WorkspaceController(IMediator mediator)
    {
        _mediator = mediator;
    }


    [HttpPost("/CreateWorkspace")]
    public async Task<IActionResult> CreateWorkspace([FromBody] CreateWorkspaceDto request)
    {
        var cmd = new CreateWorkspaceCommand
        {
            WorkSpaceDto = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpPut("/UpdateWorkspace")]
    public async Task<IActionResult> UpdateWorkspace([FromBody] UpdateWorkspaceDto request)
    {
        var cmd = new UpdateWorkspaceCommand
        {
            UpdateWorkspace = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpDelete("/DeleteWorkspace")]
    public async Task<IActionResult> DeleteWorkspace([FromQuery] int id)
    {
        var cmd = new DeleteWorkspaceCommand { Id = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }


    [HttpGet("/GetWorkspaces")]
    public async Task<IActionResult> GetWorkspaces()
    {
        var cmd = new GetWorkspacesQuery();
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpGet("/GetWorkspace")]
    public async Task<IActionResult> GetWorkspace([FromQuery] int id)
    {
        var cmd = new GetWorkspaceByIdQuery{ Id = id};
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
}