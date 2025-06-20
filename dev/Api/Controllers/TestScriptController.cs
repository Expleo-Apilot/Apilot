using dev.Application.DTOs.TestScript;
using dev.Application.Features.TestScript.Commands;
using dev.Application.Features.TestScript.Queries;
using dev.Application.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    
    [HttpPost("/SaveTestScript")]
    public async Task<IActionResult> SaveTestScript([FromBody] CreateTestScriptDto testScript)
    {
        var cmd = new CreateTestScriptCommand
        {
            CreateTestScript = testScript
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    [HttpPut("/UpdateTestScript")]
    public async Task<IActionResult> UpdateTestScript([FromBody] UpdateTestScriptDto testScript)
    {
        var cmd = new UpdateTestScriptCommand
        {
            TestScript = testScript
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    [HttpDelete("/DeleteTestScript")]
    public async Task<IActionResult> DeleteTestScript([FromQuery] int id)
    {
        var cmd = new DeleteTestScriptCommand { TestScriptId = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    [HttpGet("/GetTestScript")]
    public async Task<IActionResult> GetTestScript([FromQuery] int id)
    {
        var cmd = new GetTestScriptByIdQuery { TestScriptId = id };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    [HttpGet("/GetTestScriptsByRequestId")]
    public async Task<IActionResult> GetTestScriptsByRequestId([FromQuery] int requestId)
    {
        var cmd = new GetTestScriptsByRequestIdQuery
        {
            RequestId = requestId
        };
        var result = await _mediator.Send(cmd);
        return Ok(result);
    }
    
    [HttpPost("/RunTestScriptWithRequest")]
    public async Task<IActionResult> RunTestScriptWithRequest([FromBody] RunTestScriptRequest request)
    {
        // First, get the test script
        var getScriptCmd = new GetTestScriptByIdQuery { TestScriptId = request.TestScriptId };
        var scriptResult = await _mediator.Send(getScriptCmd);
        
        if (!scriptResult.Succeeded || scriptResult.Data == null)
        {
            return NotFound(new { message = "Test script not found" });
        }
        
        // Create a request to the TestRunnerController
        var testRunnerRequest = new TestRunnerController.TestRequest
        {
            TestCode = scriptResult.Data.ScriptContent
        };
        
        // Create an instance of the TestRunnerController
        var testRunnerController = new TestRunnerController(
            HttpContext.RequestServices.GetRequiredService<ILogger<TestRunnerController>>(),
            HttpContext.RequestServices.GetRequiredService<IHttpClientFactory>()
        );
        
        // Set the controller context
        testRunnerController.ControllerContext = new ControllerContext
        {
            HttpContext = HttpContext
        };
        
        // Run the test
        var testResult = await testRunnerController.RunTests(testRunnerRequest);
        
        return testResult;
    }
}

public class RunTestScriptRequest
{
    public int TestScriptId { get; set; }
    public int? RequestId { get; set; }
}
