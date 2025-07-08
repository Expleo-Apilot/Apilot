using dev.Application.DTOs.History;
using dev.Application.Features.History.Commands;
using dev.Application.Features.History.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[ApiController]
[Route("")]
public class HistoryController : ControllerBase
{
    private readonly IMediator _mediator;

    public HistoryController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpPost("/SaveHistory")]
    public async Task<IActionResult> SaveHistory([FromBody] CreateHistoryDto request)
    {
        var cmd = new CreateHistoryCommand
        {
            HistoryDto = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpDelete("/DeleteHistory")]
    public async Task<IActionResult> DeleteHistory([FromQuery] int id)
    {
        var cmd = new DeleteHistoryCommand { Id = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetHistories")]
    public async Task<IActionResult> GetHistories()
    {
        var cmd = new GetHistoriesQuery();
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpGet("/GetHistory")]
    public async Task<IActionResult> GetHistory([FromQuery] int id)
    {
        var cmd = new GetHistoryByIdQuery{ Id = id};
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }


    [HttpGet("/GetHistoryByWorkspaceId")]
    public async Task<IActionResult> GetHistoryByWorkspaceId([FromQuery] int workspaceId)
    {
        var cmd = new GetHistoryByWorkspaceIdQuery{ WorkspaceId = workspaceId};
        var result = await _mediator.Send(cmd);
        return Ok(result);
    } 
}