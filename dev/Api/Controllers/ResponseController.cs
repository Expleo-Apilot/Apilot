using dev.Application.DTOs.Response;
using dev.Application.Features.Response.Commands;
using dev.Application.Features.Response.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;


[ApiController]
[Route("")]
[Authorize]
public class ResponseController : ControllerBase
{
    private readonly IMediator _mediator;

    public ResponseController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    
    [HttpPost("/SaveResponse")]
    public async Task<IActionResult> SaveResponse([FromBody] CreateResponseDto request)
    {
        var cmd = new CreateResponseCommand
        {
            ResponseRequest = request
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpDelete("/DeleteResponse")]
    public async Task<IActionResult> DeleteResponse([FromQuery] int id)
    {
        var cmd = new DeleteResponseCommand { ResponseId = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetResponses")]
    public async Task<IActionResult> GetResponses()
    {
        var cmd = new GetResponsesQuery();
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }

    
    [HttpGet("/GetResponse")]
    public async Task<IActionResult> GetResponse([FromQuery] int id)
    {
        var cmd = new GetResponseByIdQuery{ Id = id};
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    
    [HttpGet("/GetResponsesByRequestId")]
    public async Task<IActionResult> GetResponsesByRequestId([FromQuery] int id)
    {
        var cmd = new GetResponsesByRequestIdQuery
        {
            RequestId = id
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
}