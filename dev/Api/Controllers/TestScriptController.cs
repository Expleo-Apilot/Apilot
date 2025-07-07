using dev.Application.DTOs.TestScript;

using dev.Application.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using dev.Application.Features.TestScript.Commands;

namespace dev.Api.Controllers;

[ApiController]
[Route("")]
[Authorize]
public class TestScriptController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public TestScriptController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }


    [HttpPost("SaveScript")]
    public async Task<IActionResult> Post([FromBody] CreateTestScriptDto createTestScriptDto)
    {
        var cmd = new CreateScriptCommand()
        {
            ScriptDto = createTestScriptDto
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
}

