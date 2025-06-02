using dev.Application.DTOs.Request;
using dev.Application.Features.Request.Commands;
using dev.Application.Features.Request.Queries;
using dev.Application.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[ApiController]
[Route("")]
[Authorize]
public class RequestController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public RequestController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }
    
    [HttpPost("/SaveRequest")]
    public async Task<IActionResult> SaveRequest([FromBody] CreateRequestDto request)
    {
        var cmd = new CreateRequestCommand
        {
            CreateRequest = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpPut("/UpdateRequest")]
    public async Task<IActionResult> UpdateRequest([FromBody] UpdateRequestDto request)
    {
        var cmd = new UpdateRequestCommand
        {
            Request = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpDelete("/DeleteRequest")]
    public async Task<IActionResult> DeleteRequest([FromQuery] int id)
    {
        var cmd = new DeleteRequestCommand { RequestId = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetRequests")]
    public async Task<IActionResult> GetRequests()
    {
        var cmd = new GetRequestsQuery();
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetRequest")]
    public async Task<IActionResult> GetRequest([FromQuery] int id)
    {
        var cmd = new GetRequestByIdQuery{ RequestId = id};
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetRequestsByCollectionId")]
    public async Task<IActionResult> GetRequestsByCollectionId([FromQuery] int id)
    {
        var cmd = new GetRequestsByCollectionIdQuery
        {
            CollectionId = id
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetRequestsByFolderId")]
    public async Task<IActionResult> GetRequestsByFolderId([FromQuery] int id)
    {
        var cmd = new GetRequestsByFolderIdQuery
        {
            FolderId = id
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
}