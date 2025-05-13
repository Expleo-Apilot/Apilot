using dev.Application.DTOs.Swagger;
using dev.Application.Features.SwaggerImport.Commands;
using dev.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class Test : ControllerBase
{
    
    private readonly IMediator _mediator;
    private readonly IRequestService _requestService;

    public Test(IRequestService requestService, IMediator mediator)
    {
        _requestService = requestService;
        _mediator = mediator;
    }


    [HttpPost("url")]
    public async Task<IActionResult> Post([FromQuery] OpenApiImportRequest request)
    {
        var cmd = new ImportOpenApiCollectionCommand
        {
            Request = request
        };
        var result = await _mediator.Send(cmd);
        
        return Ok(result);
    }
    
    [HttpPost("file")]
    public async Task<IActionResult> Query([FromQuery] OpenApiFileUploadRequest request)
    {
        var cmd = new ImportOpenApiFromFileCommand
        {
            Request = request
        };
        var result = await _mediator.Send(cmd);
        
        return Ok(result);
    }


    [HttpGet("request")]
    public async Task<IActionResult> Get()
    {
        var requests = await _requestService.GetAllRequestsAsync();
        return Ok(requests);
    }
    
    
}