using dev.Application.DTOs.Workspace;
using dev.Application.Features.Workspace.Commands;
using dev.Application.Features.Workspace.Queries;
using dev.Application.Services.CurrentUser;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[ApiController]
[Route("")]
[Authorize]
public class WorkspaceController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public WorkspaceController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }


    [HttpPost("/CreateWorkspace")]
    public async Task<IActionResult> CreateWorkspace([FromBody] CreateWorkspaceDto request)
    {

        if (_currentUserService.UserId == null)
        {
            return Unauthorized(new { message = "User not authenticated" });
        }
        

        request.UserId = _currentUserService.UserId;
        
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

        if (_currentUserService.UserId == null)
        {
            return Unauthorized(new { message = "User not authenticated" });
        }
        

        request.UserId = _currentUserService.UserId;
        

        var workspaceResult = await _mediator.Send(new GetWorkspaceByIdQuery { Id = request.Id });
        if (!workspaceResult.IsSuccess || workspaceResult.Data == null)
        {
            return NotFound(workspaceResult.Error);
        }
        
        if (workspaceResult.Data.UserId != _currentUserService.UserId)
        {
            return Forbid();
        }
        
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

        if (_currentUserService.UserId == null)
        {
            return Unauthorized(new { message = "User not authenticated" });
        }
        

        var cmd = new DeleteWorkspaceCommand { 
            Id = id,
            UserId = _currentUserService.UserId 
        };
        
        var result = await _mediator.Send(cmd);
        
        if (!result.IsSuccess)
        {
            if (result.Error != null && result.Error.Contains("permission"))
            {
                return Forbid();
            }
            return BadRequest(result);
        }
        
        return Ok(result);
    }


    [HttpGet("/GetWorkspaces")]
    public async Task<IActionResult> GetWorkspaces()
    {

        if (_currentUserService.UserId == null)
        {
            return Unauthorized(new { message = "User not authenticated" });
        }
        

        var query = new GetWorkspacesByUserIdQuery { UserId = _currentUserService.UserId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    
    [HttpGet("/GetWorkspace")]
    public async Task<IActionResult> GetWorkspace([FromQuery] int id)
    {

        if (_currentUserService.UserId == null)
        {
            return Unauthorized(new { message = "User not authenticated" });
        }
        

        var cmd = new GetWorkspaceByIdQuery{ Id = id};
        var result = await _mediator.Send(cmd);
        
        if (!result.IsSuccess || result.Data == null)
        {
            return NotFound(result.Error);
        }
        

        if (result.Data.UserId != _currentUserService.UserId)
        {
            return Forbid();
        }
        
        return Ok(result);
    }
    
}