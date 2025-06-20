using dev.Application.DTOs.TestScript;
using dev.Application.Wrappers;
using MediatR;

namespace dev.Application.Features.TestScript.Queries;

public class GetTestScriptsByRequestIdQuery : IRequest<Response<List<TestScriptDto>>>
{
    public int RequestId { get; set; }
}
