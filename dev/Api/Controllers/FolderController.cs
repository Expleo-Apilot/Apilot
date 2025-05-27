using dev.Application.DTOs.Folder;
using dev.Application.Features.Folder.Commands;
using dev.Application.Features.Folder.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[ApiController]
[Route("")]
[Authorize]
public class FolderController : ControllerBase
{
 
    private readonly IMediator _mediator;

    public FolderController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpPost("/CreateFolder")]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderDto request)
    {
        var cmd = new CreateFolderCommand
        {
            CreateFolder = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpPut("/UpdateFolder")]
    public async Task<IActionResult> UpdateFolder([FromBody] UpdateFolderDto request)
    {
        var cmd = new UpdateFolderCommand
        {
            UpdateFolderDto = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpDelete("/DeleteFolder")]
    public async Task<IActionResult> DeleteFolder([FromQuery] int id)
    {
        var cmd = new DeleteFolderCommand { Id = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetFolders")]
    public async Task<IActionResult> GetFolders()
    {
        var cmd = new GetFoldersQuery();
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpGet("/GetFolder")]
    public async Task<IActionResult> GetFolder([FromQuery] int id)
    {
        var cmd = new GetFolderByIdQuery{ Id = id};
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetFoldersByCollectionId")]
    public async Task<IActionResult> GetFoldersByCollectionId([FromQuery] int id)
    {
        var cmd = new GetFoldersByCollectionIdQuery
        {
            Id = id
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
}