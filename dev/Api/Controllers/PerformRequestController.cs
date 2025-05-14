using Apilot.Domain.Enums;
using dev.Application.DTOs.Request;
using dev.Application.Features.HttpRequests.Commands;
using dev.Application.Features.HttpRequests.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[Route("")]
[ApiController]
public class PerformRequestController : ControllerBase
{
    private readonly IMediator _mediator;

    public PerformRequestController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("/PerformRequest")]
    public async Task<IActionResult> PerformRequest([FromBody] PerformRequestDto performRequestDto)
    {
        
        object result;

        switch (performRequestDto.HttpMethod)
        {
            case ApiHttpMethod.GET:
                result = await _mediator.Send(new GetRequestQuery { RequestDto = performRequestDto });
                break;

            case ApiHttpMethod.POST:
                result = await _mediator.Send(new PostRequestCommand { RequestDto = performRequestDto });
                break;

            case ApiHttpMethod.PUT:
                result = await _mediator.Send(new PutRequestCommand { RequestDto = performRequestDto });
                break;

            case ApiHttpMethod.DELETE:
                result = await _mediator.Send(new DeleteRequestCommand { RequestDto = performRequestDto });
                break;
            case ApiHttpMethod.PATCH:
                result = await _mediator.Send(new PatchRequestCommand() { RequestDto = performRequestDto });
                break;

            default:
                return BadRequest($"Unsupported HTTP method: {performRequestDto.HttpMethod}");
        }

        return Ok(result);
    }
}