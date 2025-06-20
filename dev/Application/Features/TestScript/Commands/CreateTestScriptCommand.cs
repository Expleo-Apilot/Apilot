using dev.Application.DTOs.TestScript;
using dev.Application.Wrappers;
using MediatR;

namespace dev.Application.Features.TestScript.Commands;

public class CreateTestScriptCommand : IRequest<Response<TestScriptDto>>
{
    public CreateTestScriptDto CreateTestScript { get; set; } = null!;
}
