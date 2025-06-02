using dev.Application.DTOs.Collection;
using dev.Application.Features.Collection.Commands;
using dev.Application.Features.Collection.Queries;
using dev.Application.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;


[ApiController]
[Route("")]
[Authorize]
public class CollectionController : ControllerBase
{
    
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public CollectionController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }
    
    
    [HttpPost("/CreateCollection")]
    public async Task<IActionResult> CreateCollection([FromBody] CreateCollectionDto request)
    {
        var cmd = new CreateCollectionCommand
        {
             CreateCollectionRequest = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpPut("/UpdateCollection")]
    public async Task<IActionResult> Put([FromBody] UpdateCollectionDto request)
    {
        var cmd = new UpdateCollectionCommand
        {
            UpdateCollectionDto  = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpDelete("/DeleteCollection")]
    public async Task<IActionResult> UpdateCollection([FromQuery] int id)
    {
        var cmd = new DeleteCollectionCommand { Id = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }


    [HttpGet("/GetCollections")]
    public async Task<IActionResult> GetCollections()
    {
        var cmd = new GetCollectionsQuery();
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpGet("/GetCollection")]
    public async Task<IActionResult> GetCollection([FromQuery] int id)
    {
        var cmd = new GetCollectionByIdQuery{ Id = id};
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetCollectionsByWorkspaceId")]
    public async Task<IActionResult> GetCollectionsByWorkspaceId([FromQuery] int id)
    {
        var cmd = new GetCollectionsByWorkspaceIdQuery
        {
            WorkspaceId = id
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
}