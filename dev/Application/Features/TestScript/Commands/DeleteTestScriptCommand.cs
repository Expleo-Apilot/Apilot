using dev.Application.Wrappers;
using MediatR;

namespace dev.Application.Features.TestScript.Commands;

public class DeleteTestScriptCommand : IRequest<Response<bool>>
{
    public int TestScriptId { get; set; }
}
