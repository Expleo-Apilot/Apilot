using dev.Application.DTOs.TestScript;
using dev.Application.Wrappers;
using MediatR;

namespace dev.Application.Features.TestScript.Commands;

public class UpdateTestScriptCommand : IRequest<Response<TestScriptDto>>
{
    public UpdateTestScriptDto TestScript { get; set; } = null!;
}
