using dev.Application.DTOs.TestScript;
using dev.Application.Wrappers;
using MediatR;

namespace dev.Application.Features.TestScript.Queries;

public class GetTestScriptByIdQuery : IRequest<Response<TestScriptDto>>
{
    public int TestScriptId { get; set; }
}
