using dev.Application.Common.Models;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Response.Commands;


public record CreateResponseCommand : IRequest<Result<ResponseDto>>
{
    public required CreateResponseDto ResponseRequest { get; init; }
}


public class CreateResponseRequestHandler : IRequestHandler<CreateResponseCommand, Result<ResponseDto>>
{
 
    private readonly IResponseService _responseService;

    public CreateResponseRequestHandler(IResponseService responseService)
    {
        _responseService = responseService;
    }

    public async Task<Result<ResponseDto>> Handle(CreateResponseCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _responseService.CreateResponseAsync(request.ResponseRequest);
            return Result<ResponseDto>.Success(response);
        }
        catch (Exception ex)
        {
            return Result<ResponseDto>.Failure($"Failed to create response: {ex.Message}");
        }
    }
}