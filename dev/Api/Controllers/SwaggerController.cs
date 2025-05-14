using dev.Application.DTOs.Swagger;
using dev.Application.Features.SwaggerImport.Commands;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace dev.Api.Controllers;

[Route("")]
[ApiController]
public class SwaggerController : ControllerBase
{
    
    private readonly IMediator _mediator;

    public SwaggerController(IMediator mediator)
    { 
        _mediator = mediator;
    }


    [HttpPost("/ImportFromUrl")]
    public async Task<IActionResult> ImportFromUrl([FromQuery] OpenApiImportRequest request)
    {
        var cmd = new ImportOpenApiCollectionCommand
        {
            Request = request
        };
        var result = await _mediator.Send(cmd);
        
        return Ok(result);
    }
    
    [HttpPost("/ImportFromFile")]
    public async Task<IActionResult> ImportFromFile([FromQuery] OpenApiFileUploadRequest request)
    {
        var cmd = new ImportOpenApiFromFileCommand
        {
            Request = request
        };
        var result = await _mediator.Send(cmd);
        
        return Ok(result);
    }
    
    
    
}